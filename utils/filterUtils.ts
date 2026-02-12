/**
 * Checks if a text matches a filter string.
 * Supports boolean logic:
 * - "A or B" -> Matches if text contains A OR B
 * - "A and B" -> Matches if text contains A AND B
 * - "A" -> Matches if text contains A
 */
export const matchesFilter = (textToSearch: string, filterText: string): boolean => {
    if (!filterText) return true;
    if (!textToSearch) return false;

    const lowerText = textToSearch.toLowerCase();
    const lowerFilter = filterText.toLowerCase();

    // Split by " or " first to support boolean OR
    const orGroups = lowerFilter.split(' or ').map(g => g.trim()).filter(g => g.length > 0);

    // Check if ANY of the OR groups match
    return orGroups.some(group => {
        // Inside each OR group, split by " and " for boolean AND
        const terms = group.split(' and ').map(t => t.trim()).filter(t => t.length > 0);

        // Check if ALL terms in this specific group match
        return terms.every(term => lowerText.includes(term));
    });
};
