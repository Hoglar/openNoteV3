from copy import deepcopy

from django.test import TestCase, Client
from rest_framework.test import APIClient

from accounts.models import User
from notes.models import Note
from .models import Star, Placement, Connection, Practice


class EasyWorkTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(display_name='Ada')
        self.reader = User.objects.create_user(display_name='Linus')
        self.client = APIClient()
        self.client.force_authenticate(self.owner)
        self.payload = {'title': 'Integrasjon', 'theory': r'## Teori $x^2$', 'exercises': [
            {'id': 'one', 'prompt': r'$$\int 2x\,dx$$', 'answer': '$x^2+C$'},
            {'id': 'two', 'prompt': 'Neste oppgave', 'answer': ''},
        ]}
        result = self.client.post('/api/stars/', self.payload, format='json')
        self.assertEqual(result.status_code, 201, result.data)
        self.star = Star.objects.get(pk=result.data['id'])

    def borrow(self, star=None):
        self.client.force_authenticate(self.reader)
        return self.client.post('/api/map/', {'star': str((star or self.star).id)}, format='json')

    def complete(self, exercise='one'):
        self.star.refresh_from_db()
        return self.client.post(f'/api/stars/{self.star.id}/practice/', {'exercise_id': exercise, 'revision': self.star.updated_at.isoformat()}, format='json')

    def test_public_content_and_stable_personal_coordinates(self):
        first = self.client.get('/api/map/').json()['entries'][0]
        self.assertEqual(self.borrow().status_code, 200)
        own = self.client.get('/api/map/').json()['entries'][0]
        self.assertNotEqual((first['x'], first['y']), (own['x'], own['y']))
        self.assertEqual(self.client.get('/api/map/').json()['entries'][0], own)
        self.client.force_authenticate(None)
        response = self.client.get(f'/api/map/?owner={self.owner.id}')
        self.assertEqual(response.json()['entries'][0], first)
        self.assertNotIn('practice', response.json())
        self.assertEqual(self.client.get(f'/api/stars/{self.star.id}/').status_code, 200)
        self.assertEqual(self.client.post('/api/stars/', self.payload, format='json').status_code, 403)
        self.assertEqual(self.client.get(f'/api/stars/{self.star.id}/practice/').status_code, 403)

    def test_borrow_tracks_owner_edits_and_forbids_reader_edits(self):
        self.borrow()
        detail = f'/api/stars/{self.star.id}/'
        self.assertEqual(self.client.patch(detail, {'theory': 'Hacked'}, format='json').status_code, 403)
        self.assertEqual(self.client.delete(detail).status_code, 403)
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.patch(detail, {'theory': 'Ny teori'}, format='json').status_code, 200)
        self.client.force_authenticate(self.reader)
        self.assertEqual(self.client.get(detail).json()['theory'], 'Ny teori')
        self.assertEqual(Star.objects.count(), 1)

    def test_remove_and_restore_preserves_position_progress_but_not_edges(self):
        neighbor = Star.objects.create(owner=self.owner, title='Nabo', theory='Teori')
        self.borrow(); self.borrow(neighbor)
        before = self.client.get('/api/map/').json()['entries']
        connection = self.client.post('/api/connections/', {'source': str(self.star.id), 'target': str(neighbor.id)}, format='json')
        self.assertEqual(connection.status_code, 200)
        self.assertEqual(self.complete().status_code, 200)
        self.assertEqual(self.client.delete(f'/api/map/{self.star.id}/').status_code, 204)
        self.assertTrue(Star.objects.filter(pk=self.star.id).exists())
        self.assertTrue(Placement.objects.get(owner=self.owner, star=self.star).active)
        self.assertEqual(Connection.objects.count(), 0)
        self.assertEqual(Practice.objects.count(), 1)
        self.assertEqual(self.complete('two').status_code, 400)
        self.borrow()
        self.assertEqual(self.client.get('/api/map/').json()['entries'], before)
        self.assertEqual(self.complete().json()['repetitions'], 1)

    def test_original_deletion_cascades_references_not_neighbors_or_notes(self):
        neighbor = Star.objects.create(owner=self.owner, title='Nabo', theory='Teori')
        self.borrow(); self.borrow(neighbor); self.complete()
        self.client.post('/api/connections/', {'source': str(self.star.id), 'target': str(neighbor.id)}, format='json')
        note = Note.objects.create(owner=self.reader, title='Logg', body='Behold teksten')
        note.stars.add(self.star, neighbor)
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.delete(f'/api/stars/{self.star.id}/').status_code, 204)
        self.assertFalse(Placement.objects.filter(star_id=self.star.id).exists())
        self.assertEqual(Connection.objects.count(), 0)
        self.assertEqual(Practice.objects.count(), 0)
        self.assertEqual(note.stars.get(), neighbor)
        self.assertTrue(Star.objects.filter(pk=neighbor.id).exists())
        note.refresh_from_db(); self.assertEqual(note.body, 'Behold teksten')

    def test_private_idempotent_progress_and_new_round(self):
        self.borrow()
        first = self.complete().json()
        self.assertEqual(first['completed'], ['one'])
        self.assertEqual(first['repetitions'], 1)
        self.assertEqual(self.complete().json(), first)
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.get(f'/api/stars/{self.star.id}/practice/').json()['completed'], [])
        self.client.force_authenticate(self.reader)
        reset = self.client.post(f'/api/stars/{self.star.id}/practice/', {'reset': True}, format='json').json()
        self.assertEqual(reset['completed'], [])
        self.assertEqual(reset['repetitions'], 1)
        self.assertEqual(self.complete().json()['repetitions'], 2)
        self.assertEqual(self.complete('missing').status_code, 400)
        self.assertIn('no-store', self.client.get(f'/api/stars/{self.star.id}/practice/')['Cache-Control'])

    def test_changed_exercise_invalidates_only_its_completion(self):
        self.borrow(); self.complete(); self.complete('two')
        stale_revision = self.star.updated_at.isoformat()
        self.client.force_authenticate(self.owner)
        exercises = deepcopy(self.payload['exercises']); exercises[0]['answer'] = 'Oppdatert fasit'
        self.client.patch(f'/api/stars/{self.star.id}/', {'exercises': exercises}, format='json')
        self.client.force_authenticate(self.reader)
        self.assertEqual(self.client.get(f'/api/stars/{self.star.id}/practice/').json()['completed'], ['two'])
        self.assertEqual(self.client.post(f'/api/stars/{self.star.id}/practice/', {'exercise_id': 'one', 'revision': stale_revision}, format='json').status_code, 400)
        self.assertEqual(self.complete().json()['repetitions'], 3)

    def test_connections_are_undirected_and_owned_by_map_owner(self):
        self.borrow()
        other = Star.objects.create(owner=self.owner, title='Nabo', theory='Teori')
        payload = {'source': str(self.star.id), 'target': str(other.id)}
        self.assertEqual(self.client.post('/api/connections/', payload, format='json').status_code, 400)
        self.borrow(other)
        edge = self.client.post('/api/connections/', payload, format='json').json()
        reverse = self.client.post('/api/connections/', {'source': payload['target'], 'target': payload['source']}, format='json').json()
        self.assertEqual(edge, reverse)
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.delete(f'/api/connections/{edge["id"]}/').status_code, 404)
        self.assertEqual(self.client.delete(f'/api/map/{other.id}/').status_code, 404)
        self.client.force_authenticate(self.reader)
        self.assertEqual(self.client.delete(f'/api/connections/{edge["id"]}/').status_code, 204)

    def test_validation_limits_and_profile_gate(self):
        for exercises in [[{'id': 'one', 'prompt': 'x'}], [self.payload['exercises'][0]] * 2, ['bad'], {'bad': 'data'}]:
            result = self.client.post('/api/stars/', {**self.payload, 'exercises': exercises}, format='json')
            self.assertEqual(result.status_code, 400, result.data)
        self.assertEqual(self.client.post('/api/stars/', {**self.payload, 'title': 'x'*121}, format='json').status_code, 400)
        self.assertEqual(self.client.post('/api/map/', {'star': 'invalid'}, format='json').status_code, 400)
        for path in ['/api/map/', '/api/connections/', f'/api/stars/{self.star.id}/practice/']:
            self.assertEqual(self.client.post(path, [['bad']], format='json').status_code, 400)
        unnamed = User.objects.create_user()
        self.client.force_authenticate(unnamed)
        self.assertEqual(self.client.post('/api/stars/', self.payload, format='json').status_code, 403)
        self.assertEqual(Star.objects.count(), 1)

    def test_csrf_required_for_session_writes(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.owner, backend='allauth.account.auth_backends.AuthenticationBackend')
        self.assertEqual(client.post('/api/stars/', self.payload, content_type='application/json').status_code, 403)
        token = client.get('/api/auth/session/').json()['csrfToken']
        self.assertEqual(client.post('/api/stars/', self.payload, content_type='application/json', HTTP_X_CSRFTOKEN=token).status_code, 201)

    def test_map_limit_rolls_back_creation(self):
        stars = [Star(owner=self.owner, title=f'Tema {i}', theory='Teori') for i in range(199)]
        Star.objects.bulk_create(stars)
        Placement.objects.bulk_create([Placement(owner=self.owner, star=star, x=10, y=10) for star in stars])
        self.assertEqual(self.client.post('/api/stars/', self.payload, format='json').status_code, 400)
        self.assertEqual(Star.objects.count(), 200)
