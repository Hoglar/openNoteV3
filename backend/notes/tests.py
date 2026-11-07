import json

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from easywork.models import Star
from .models import Note, Comment


class NotesTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(display_name='Ada')
        self.reader = User.objects.create_user(display_name='Linus')
        self.client = APIClient()
        self.client.force_authenticate(self.owner)
        self.star = Star.objects.create(owner=self.reader, title='Fourier', theory='Teori')
        result = self.client.post('/api/notes/', {'title': 'Fourier-rekker', 'body': r'## Integral $x^2$', 'tags': [' MATEMATIKK ', 'matematikk', 'Fourier'], 'star_ids': [str(self.star.id)]}, format='json')
        self.assertEqual(result.status_code, 201, result.data)
        self.note = Note.objects.get(pk=result.data['id'])
        self.detail = f'/api/notes/{self.note.id}/'
        self.comments = self.detail + 'comments/'

    def test_public_read_search_combined_tags_and_star_links(self):
        Note.objects.create(owner=self.owner, title='Annet', body='integral', tags=['matematikk'])
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.detail).json()['stars'][0]['id'], str(self.star.id))
        self.assertEqual(self.note.tags, ['matematikk', 'fourier'])
        result = self.client.get('/api/notes/?q=INTEGRAL&tag=Matematikk&tag=fourier').json()
        self.assertEqual(result['count'], 1)
        self.assertEqual(self.client.get(f'/api/notes/?star={self.star.id}').json()['count'], 1)
        self.assertEqual(self.client.get('/api/notes/?tag=unknown').json()['count'], 0)
        self.assertEqual(self.client.post('/api/notes/', {}, format='json').status_code, 403)
        self.assertEqual(self.client.post(self.comments, {'body': 'x'}, format='json').status_code, 403)

    def test_only_author_can_edit_delete_and_cannot_transfer_ownership(self):
        self.client.force_authenticate(self.reader)
        self.assertEqual(self.client.patch(self.detail, {'body': 'x'}, format='json').status_code, 403)
        self.assertEqual(self.client.delete(self.detail).status_code, 403)
        self.client.force_authenticate(self.owner)
        result = self.client.patch(self.detail, {'body': 'Oppdatert', 'owner': {'id': str(self.reader.id)}}, format='json')
        self.assertEqual(result.status_code, 200)
        self.note.refresh_from_db()
        self.assertEqual(self.note.owner, self.owner)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.detail).json()['body'], 'Oppdatert')

    def test_flat_comments_owner_rights_and_note_cascade(self):
        self.client.force_authenticate(self.reader)
        body = r'**Bra** $\frac{1}{2}$'
        created = self.client.post(self.comments, {'body': body}, format='json')
        self.assertEqual(created.status_code, 201)
        detail = self.comments + str(created.data['id']) + '/'
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.comments).json()['results'][0]['body'], body)
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.patch(detail, {'body': 'x'}, format='json').status_code, 403)
        self.assertEqual(self.client.delete(detail).status_code, 403)
        self.client.force_authenticate(self.reader)
        self.assertEqual(self.client.patch(detail, {'body': 'Endret'}, format='json').status_code, 200)
        self.assertEqual(self.client.delete(detail).status_code, 204)
        self.client.post(self.comments, {'body': 'En ny kommentar'}, format='json')
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.delete(self.detail).status_code, 204)
        self.assertEqual(Comment.objects.count(), 0)
        self.assertTrue(Star.objects.filter(pk=self.star.id).exists())

    def test_validation_pagination_and_no_thread_payload(self):
        for patch in [{'title': ' '}, {'body': 'x'*50001}, {'tags': ['x']*11}, {'star_ids': ['invalid']}, {'unknown': 'field'}]:
            result = self.client.patch(self.detail, patch, format='json')
            self.assertEqual(result.status_code, 400, result.data)
        self.assertEqual(self.client.post(self.comments, {'body': 'x', 'parent': 'x'}, format='json').status_code, 400)
        self.assertEqual(self.client.post(self.comments, {'body': 'x'*10001}, format='json').status_code, 400)
        Note.objects.bulk_create([Note(owner=self.owner, title=f'Notat {i}', body='Body') for i in range(25)])
        first = self.client.get('/api/notes/').json()
        self.assertEqual(first['count'], 26)
        self.assertEqual(len(first['results']), 20)
        self.assertEqual(len(self.client.get('/api/notes/?page=2').json()['results']), 6)

    def test_parser_rejects_oversize_and_unstorable_text(self):
        for body in ['x' * (512 * 1024), '\x00', '\ud800']:
            response = self.client.generic('PATCH', self.detail, json.dumps({'body': body}).encode(), content_type='application/json')
            self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.post('/api/notes/', ['bad'], format='json').status_code, 400)
