import { useNavigate } from 'react-router';
import { PlaceholderPage } from '../../shared/PlaceholderPage';
import { useDemoSession } from './DemoSession';

export function LoginPage() {
  const { isSignedIn, signIn } = useDemoSession();
  const navigate = useNavigate();

  return (
    <PlaceholderPage eyebrow="Tilgang / Demonstrasjon" title="Logg inn">
      <span className="status-tag">Prototype</span>
      <h2>{isSignedIn ? 'Du er innlogget i demonstrasjonen.' : 'Prøv innloggingen.'}</h2>
      <p>Dette er en simulering. Ingen konto opprettes, og vi ber ikke om passord. Innloggingen nullstilles når du laster siden på nytt.</p>
      <button className="primary-button" onClick={() => {
        signIn();
        navigate('/');
      }}>{isSignedIn ? 'Til startsiden' : 'Simuler innlogging'}<span aria-hidden="true">↗</span></button>
    </PlaceholderPage>
  );
}
