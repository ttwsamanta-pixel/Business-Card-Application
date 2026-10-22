import { store } from "../store.js";
import type { PublicUser } from "../types.js";

export function visibleCards(user: PublicUser) {
  return user.isSuperAdmin ? store.listAllCards() : store.listCards(user.id);
}
export function accessibleCard(user: PublicUser, id: string) {
  return user.isSuperAdmin
    ? store.getCardById(id)
    : store.getCardForUser(user.id, id);
}
export async function managementScope(user: PublicUser) {
  const cards = await visibleCards(user);
  const owners = user.isSuperAdmin ? await store.listUsers() : [user];
  const events = [],
    folders = [],
    members = [];
  for (const owner of owners) {
    events.push(...(await store.listEvents(owner.id)));
    folders.push(
      ...(await store.listFolders(owner.id)).map((folder) => ({
        ...folder,
        userId: owner.id,
        ownerName: owner.name,
      })),
    );
    members.push(...(await store.folderMembers(owner.id)));
  }
  return { cards, owners, events, folders, members };
}
