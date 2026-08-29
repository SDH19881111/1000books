import assert from 'node:assert/strict';
import test from 'node:test';
import { READING_WORLDS } from '@/lib/bookEconomy';
import {
  getRabbitItems,
  getWorldItems,
} from '@/lib/gameCatalog';
import { migratePersistedGameState, useGameStore } from '@/store/useGameStore';

test('each background only exposes items assigned to that reading world', () => {
  READING_WORLDS.forEach((world) => {
    const items = getWorldItems(world.id);

    assert.ok(items.length >= 12);
    assert.ok(items.every((item) => item.worldId === world.id));
    assert.ok(items.every((item) => item.area !== 'rabbit'));
  });

  const forestItems = getWorldItems('story-forest');
  assert.equal(forestItems.some((item) => item.id === 'room-rug'), false);
  assert.equal(forestItems.some((item) => item.id === 'yard-treehouse'), true);
});

test('rabbit tab contains every rabbit item including the four new accessories', () => {
  const rabbitItems = getRabbitItems();
  const rabbitItemIds = new Set(rabbitItems.map((item) => item.id));

  assert.ok(rabbitItems.every((item) => item.area === 'rabbit'));
  assert.ok(rabbitItemIds.has('rabbit-flower-crown'));
  assert.ok(rabbitItemIds.has('rabbit-sailor-cap'));
  assert.ok(rabbitItemIds.has('rabbit-mint-cape'));
  assert.ok(rabbitItemIds.has('rabbit-telescope'));
});

test('equipping a rabbit accessory replaces another item in the same slot', () => {
  useGameStore.setState({
    ownedItemIds: ['rabbit-bow', 'rabbit-wizard', 'rabbit-flower-crown'],
    equippedRabbitItems: ['rabbit-bow'],
  });

  useGameStore.getState().toggleEquippedItem('rabbit-wizard');
  assert.deepEqual(useGameStore.getState().equippedRabbitItems, ['rabbit-wizard']);

  useGameStore.getState().toggleEquippedItem('rabbit-flower-crown');
  assert.deepEqual(useGameStore.getState().equippedRabbitItems, ['rabbit-flower-crown']);
});

test('legacy rabbit equipment is normalized to one item per slot', () => {
  const migrated = migratePersistedGameState({
    equippedRabbitItems: [
      'rabbit-bow',
      'rabbit-wizard',
      'rabbit-book',
      'rabbit-telescope',
      'rabbit-scarf',
    ],
  });

  assert.deepEqual(migrated.equippedRabbitItems, [
    'rabbit-wizard',
    'rabbit-telescope',
    'rabbit-scarf',
  ]);
});
