// spotifyConfig.ts

/**
 * El Client ID de tu aplicación de Spotify.
 * Este valor es fijo y se obtiene desde tu Dashboard de Desarrollador de Spotify.
 */
export const SPOTIFY_CLIENT_ID = 'a09e31c757704f4b94153b2ba8845c1b';

/**
 * ###############################################################################
 * # ADVERTENCIA DE SEGURIDAD GRAVE                                              #
 * ###############################################################################
 *
 * El Client Secret NUNCA debe ser expuesto en una aplicación de frontend (código
 * que se ejecuta en el navegador del cliente). Hacerlo permite que cualquiera
 * pueda robar tus credenciales y suplantar tu aplicación.
 *
 * Se ha incluido aquí únicamente bajo la petición explícita del usuario para un
 * entorno de desarrollo privado y controlado, y NO DEBE USARSE EN PRODUCCIÓN.
 *
 * La forma correcta de manejar esto es tener un backend (servidor) que almacene
 * el Client Secret de forma segura y gestione las peticiones de token.
 */
export const SPOTIFY_CLIENT_SECRET = '4d328e5daebb418f9a571d50b2295424';


/**
 * La URL a la que Spotify redirigirá después de que el usuario inicie sesión.
 * Este valor ya no se usa con el flujo de Client Credentials, pero se mantiene
 * por si se necesita en el futuro.
 */
export const SPOTIFY_REDIRECT_URI = `${window.location.origin}/index.html`;