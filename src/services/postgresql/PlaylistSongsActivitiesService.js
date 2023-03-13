const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvarianError = require('../../exceptions/InvariantError');

class PlaylistSongsActivitiesService {
    constructor() {
        this._pool = new Pool();
    }

    async addPlaylistSongActivities(playlistId, {
        songId,
        userId,
        action,
    }) {
        const id = `activity-${nanoid(16)}`;

        const query = {
            text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5) RETURNING id',
            values: [id, playlistId, songId, userId, action],
        };
        const result = await this._pool.query(query);

        if (!result.rowCount) {
            throw new InvarianError('Activity gagal ditambahkan ke playlist');
        }

        return result.rows[0].id;
    }

    async getPlaylistSongActivities(playlistId) {
        const query = {
            text: `SELECT users.username, song.title, action, time FROM playlist_song_activities
            JOIN songs ON song.id = playlist_song_activities.song_id
            JOIN users ON users.id = playlist_song_activities.user_id
            WHERE playlist_song_activities.playlist_id = $1
            ORDER BY playlist_song_activities.action`,
            values: [playlistId],
        };

        const result = await this._pool.query(query);

        return {
            playlistId, activities: result.rows,
        };
    }
}

module.exports = PlaylistSongsActivitiesService;