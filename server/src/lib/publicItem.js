export function toPublicItem(it) {
  const { _nl, _cl, ...rest } = it;
  return rest;
}

export function toPublicItems(list) {
  const out = new Array(list.length);
  for (let i = 0; i < list.length; i++) {
    out[i] = toPublicItem(list[i]);
  }
  return out;
}
