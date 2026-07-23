const serverBooksData = Array.from({length: 5000}, (_, i) => ({
  slug: `book-${i}`,
  subject_label: 'Subject',
  view_count: Math.floor(Math.random() * 1000),
  created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString()
}));

const cards = Array.from({length: 5000}, (_, i) => ({
  getAttribute: () => `book-${i}`
}));
const cards2 = [...cards];

const pinned = [];
const sortVal = 'popular';

console.time('Baseline Sort');
const baselineBookDataMap = new Map();
serverBooksData.forEach(b => baselineBookDataMap.set(b.slug, b));
const baselinePinnedSet = new Set(pinned);

cards.sort((a, b) => {
    const slugA = a.getAttribute('data-slug');
    const slugB = b.getAttribute('data-slug');
    const aPinned = baselinePinnedSet.has(slugA);
    const bPinned = baselinePinnedSet.has(slugB);

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    const dataA = baselineBookDataMap.get(slugA);
    const dataB = baselineBookDataMap.get(slugB);

    if (sortVal === 'popular' && dataA && dataB) {
        if (dataB.view_count !== dataA.view_count) {
            return dataB.view_count - dataA.view_count;
        }
    } else if (sortVal === 'oldest' && dataA && dataB) {
        return dataA.created_at < dataB.created_at ? -1 : (dataA.created_at > dataB.created_at ? 1 : 0);
    }
    // newest default
    if (dataA && dataB) {
        return dataB.created_at < dataA.created_at ? -1 : (dataB.created_at > dataA.created_at ? 1 : 0);
    }
    return 0;
});
console.timeEnd('Baseline Sort');

console.time('Optimized Sort');
const bookDataMap = new Map();
serverBooksData.forEach(b => bookDataMap.set(b.slug, b));
const pinnedSet = new Set(pinned);

cards2.sort((a, b) => {
    const slugA = a.getAttribute('data-slug');
    const slugB = b.getAttribute('data-slug');
    const aPinned = pinnedSet.has(slugA);
    const bPinned = pinnedSet.has(slugB);

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    const dataA = bookDataMap.get(slugA);
    const dataB = bookDataMap.get(slugB);

    if (sortVal === 'popular' && dataA && dataB) {
        if (dataB.view_count !== dataA.view_count) {
            return dataB.view_count - dataA.view_count;
        }
    } else if (sortVal === 'oldest' && dataA && dataB) {
        return dataA.created_at < dataB.created_at ? -1 : (dataA.created_at > dataB.created_at ? 1 : 0);
    }
    // newest default
    if (dataA && dataB) {
        return dataB.created_at < dataA.created_at ? -1 : (dataB.created_at > dataA.created_at ? 1 : 0);
    }
    return 0;
});
console.timeEnd('Optimized Sort');
