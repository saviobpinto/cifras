
const cases = [
    "A7(13-)",
    "D7(9)",
    "Cmaj7",
    "Em7/G",
    "G(add9)",
    "Bb",
    "F#m7b5",
    "A boy walked down the street", // Should NOT match "boy", "walked", etc
    "C G Am F",
    "A7(b9)/G#"
];

// Proposed regex with lookahead fix and expanded character set
const regex = /\b[A-G](?:#|b|♯|♭)?(?:m|maj|min|aug|dim|sus|add|M|°|ø|\+|[0-9]|b|#|-)*(?:[\(][\d\+\-b#a-zA-Z]+[\)])?(?:\/[A-G](?:#|b|♯|♭)?)?(?=\s|$)/g;

console.log("Regex Source:", regex.source);

cases.forEach(c => {
    const matches = c.match(regex);
    console.log(`"${c}" ->`, matches);
});
