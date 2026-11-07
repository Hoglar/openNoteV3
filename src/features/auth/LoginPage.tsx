import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { PlaceholderPage } from '../../shared/PlaceholderPage';
import { useSession } from './Session';

export function LoginPage() {
  const { user, providers, csrfToken, loading, error, refresh, saveName } = useSession();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => { setName(user?.displayName ?? ''); }, [user?.displayName]);

  return (
    <PlaceholderPage eyebrow="Tilgang / Konto" title="Logg inn">
      {loading ? <p role="status">Henter innlogging …</p> : error ? <>
        <p role="alert">{error}</p>
        <button className="primary-button" onClick={() => void refresh()}>Prøv igjen</button>
      </> : user ? <>
        <h2>{user.needsDisplayName ? 'Velg visningsnavn' : `Innlogget som ${user.displayName}`}</h2>
        <p>Visningsnavnet er offentlig. Du kan bruke et pseudonym og endre det senere.</p>
        <form className="auth-form" onSubmit={async event => {
          event.preventDefault();
          setSaving(true);
          setSaveError(null);
          try { await saveName(name); navigate('/'); }
          catch (cause) { setSaveError(cause instanceof Error ? cause.message : 'Kunne ikke lagre navnet.'); }
          finally { setSaving(false); }
        }}>
          <label htmlFor="display-name">Visningsnavn</label>
          <input id="display-name" value={name} onChange={event => setName(event.target.value)}
            minLength={2} maxLength={40} required autoComplete="nickname" disabled={saving} />
          {saveError && <p role="alert">{saveError}</p>}
          <button className="primary-button" disabled={saving}>{saving ? 'Lagrer …' : 'Lagre visningsnavn'}</button>
        </form>
      </> : <>
        <h2>Fortsett med en konto du allerede har.</h2>
        <p>Bruk Google eller GitHub. Etter første innlogging velger du et offentlig visningsnavn.</p>
        <p className="muted">Bruk samme leverandør hver gang. Google og GitHub oppretter separate kontoer.</p>
        {params.has('error') && <p role="alert">Innloggingen ble avbrutt eller mislyktes. Prøv igjen.</p>}
        <div className="provider-buttons">
          {providers.map(provider => <form key={provider.id} method="post" action="/_allauth/browser/v1/auth/provider/redirect">
            <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
            <input type="hidden" name="provider" value={provider.id} />
            <input type="hidden" name="process" value="login" />
            <input type="hidden" name="callback_url" value="/login" />
            <button className="primary-button" disabled={!provider.enabled || !csrfToken}>Fortsett med {provider.name}</button>
            {!provider.enabled && <p className="muted">{provider.name}-innlogging er ikke satt opp ennå.</p>}
          </form>)}
        </div>
      </>}
    </PlaceholderPage>
  );
}
