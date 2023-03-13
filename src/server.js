require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

// Albums
const albums = require('./api/albums');
const AlbumsService = require('./services/postgresql/AlbumsServices');
const AlbumsValidator = require('./validators/albums');

// Songs
const songs = require('./api/songs');
const SongsService = require('./services/postgresql/SongsServices');
const SongsValidator = require('./validators/songs');
const ClientError = require('./exceptions/ClientError');

// Users
const users = require('./api/users');
const UsersService = require('./services/postgresql/UsersServices');
const UsersValidator = require('./validators/users');

// Authentications
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgresql/AuthenticationsService');
const TokenManager = require('./tokenize/tokenManager');
const AuthenticationsValidator = require('./validators/authentications');

// Playlist
const playlist = require('./api/playlists');
const PlaylistService = require('./services/postgresql/PlaylistsServices');
const PlaylistValidator = require('./validators/playlists');

// Playlist Songs
const playlistSongs = require('./api/playlistSong');
const PlaylistSongsService = require('./services/postgresql/PlaylistSongsServices');
const PlaylistSongsValidator = require('./validators/playlistSongs');

// Playlist Songs Activities
const playlistSongActivities = require('./api/playlistSongActivities');
const PlaylistSongsActivitiesService = require('./services/postgresql/PlaylistSongsActivitiesService');

// Collaborations
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgresql/CollaborationsServices');
const CollaborationsValidator = require('./validators/collaborations');


const init = async () => {
    const collaborationsService = new CollaborationsService();
    const authenticationsService = new AuthenticationsService();
    const albumsService = new AlbumsService();
    const songsService = new SongsService();
    const usersService = new UsersService();
    const playlistService = new PlaylistService();
    const playlistSongService = new PlaylistSongsService();
    const playlistsSongsActivitiesService = new PlaylistSongsActivitiesService();

    const server = Hapi.server({
        port: process.env.PORT,
        host: process.env.HOST,
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    // registrasi plugin eksternal
    await server.register([
        {
            plugin: Jwt,
        },
    ]);

    // mendefinisikan strategy autentikasi jwt
    server.auth.strategy('openmusic_jwt', 'jwt', {
        keys: process.env.ACCESS_TOKEN_KEY,
        verify: {
            aud: false,
            iss: false,
            sub: false,
            maxAgeSec: process.env.ACCESS_TOKEN_AGE,
        },
        validate: (artifacts) => ({
            isValid: true,
            credentials: {
                id: artifacts.decoded.payload.id,
            },
        }),
    });

    await server.register([
        {
            plugin: albums,
            options: {
                service: albumsService,
                validator: AlbumsValidator,
            },
        },
        {
            plugin: songs,
               options: {
                service: songsService,
                validator: SongsValidator,
            },
        },
        {
            plugin: users,
            options: {
                service: usersService,
                validator: UsersValidator,
            },
        },
        {
            plugin: authentications,
            options: {
                authenticationsService,
                usersService,
                tokenManager: TokenManager,
                validator: AuthenticationsValidator,
            },
        },
        {
            plugin: playlist,
            options: {
                service: playlistService,
                validator: PlaylistValidator,
            },
        },
        {
            plugin: playlistSongs,
            options: {
                playlistService,
                songsService,
                playlistSongService,
                playlistsSongsActivitiesService,
                validator: PlaylistSongsValidator,
            },
        },
        {
            plugin: playlistSongActivities,
            options: {
                playlistService,
                playlistsSongsActivitiesService,
            },
        },
        {
            plugin: collaborations,
            options: {
                collaborationsService,
                playlistService,
                usersService,
                validator: CollaborationsValidator,
            },
        },
    ]);

    server.ext('onPreResponse', (request, h) => {
        const { response } = request;
        
        if (response instanceof ClientError) {
            const newResponse = h.response({
                status: 'fail',
                message: respons.message,
            });
            newResponse.code(respons.statusCode);
            return newResponse;
        }
        return response.continue || response;
    });

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
};

init();