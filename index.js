import { MatrixClient, SimpleFsStorageProvider, AutojoinRoomsMixin } from 'matrix-bot-sdk';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { parse } from 'yaml'

const dataDir = resolve(cwd(), 'data');
const storagePath = resolve(dataDir, 'storage.json');
const configPath = resolve(dataDir, 'config.yml');

const {
    homeserver_url: homeserverUrl,
    bot_id: botId,
    bot_token: token,
    chat_mappings: chatMappingsRaw,
    forwardable_events: eventTypes,
} = parse(readFileSync(configPath, 'utf8'));

const chatMappings = prepareChatMappings(chatMappingsRaw);
const storage = new SimpleFsStorageProvider(storagePath);
const client = new MatrixClient(homeserverUrl, token, storage);

AutojoinRoomsMixin.setupOnClient(client);
client.on('room.event', handleMessage);

await client.start();
console.log('[INFO] Bot started');

function prepareChatMappings(mappings) {
    const res = {};
    for (const [chat1, chat2] of Object.entries(mappings)) {
        res[chat1] = chat2;
        res[chat2] = chat1;
    }
    return res;
}

async function handleMessage(roomId, { sender, type, content }) {
    if (sender === botId) return;
    const targetRoom = chatMappings[roomId];
    if (!targetRoom) return;
    if (!eventTypes.includes(type)) {
        console.log(`[INFO] Skipping event type ${type} in room ${roomId}`);
        return;
    }
    if (!Object.keys(content).length) {
        console.log('[INFO] No content to forward, skipping');
        return;
    }
    try {
        await client.sendEvent(targetRoom, type, content);
        console.log(`[INFO] Forwarded message from chat ${roomId} to chat ${targetRoom}`);
    } catch (e) {
        console.error(`[ERROR] Failed to forward message: ${e?.message || String(e)}`);
    }
}
