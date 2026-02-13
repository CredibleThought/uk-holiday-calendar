
const matchesFilter = (textToSearch, filterText) => {
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
        return terms.every(term => {
            if (term.startsWith('not ')) {
                const exclusion = term.slice(4).trim();
                return exclusion.length > 0 && !lowerText.includes(exclusion);
            }
            return lowerText.includes(term);
        });
    });
};

console.log("Test 1 (Target Case):", matchesFilter("Holiday in Texas", "texas or not ("));
// Group 1: "texas" -> matches "Holiday in Texas". Result: True.
// Correct.

console.log("Test 2 (Target Case Negative):", matchesFilter("Holiday (Public)", "texas or not ("));
// Group 1: "texas" -> match? No.
// Group 2: "not (" -> starts with not. exclusion "(". Does "Holiday (Public)" include "("? Yes. So !includes is False.
// Result: False.
// Correct.

console.log("Test 3 (Simple Not):", matchesFilter("Apple", "not Banana")); // True.
console.log("Test 4 (Simple Not Fail):", matchesFilter("Banana", "not Banana")); // False.

console.log("Test 5 (And Not):", matchesFilter("Apple Pie", "Apple and not Banana")); // True.
console.log("Test 6 (And Not Fail):", matchesFilter("Apple Banana", "Apple and not Banana")); // False.
