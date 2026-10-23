import { maskPhone, mapCursorPosition, isValidPhone } from './src/utils/phone.js';

// Test 1: Paste with country code (+55) - cursor at end
console.log("=== Test 1: Paste with +55 country code ===");
const pasteWithCountryCode = "+55 11 98765-4321";
const masked1 = maskPhone(pasteWithCountryCode);
console.log(`Input: "${pasteWithCountryCode}"`);
console.log(`Masked: "${masked1}"`);
console.log(`Valid: ${isValidPhone(masked1)}`);
const cursorEnd = mapCursorPosition(pasteWithCountryCode, pasteWithCountryCode.length, masked1);
console.log(`Cursor at end (${pasteWithCountryCode.length}) -> masked pos: ${cursorEnd} (masked length: ${masked1.length})`);
console.log();

// Test 2: Paste with country code - cursor in middle
console.log("=== Test 2: Paste with +55 - cursor in middle ===");
const midPos = 8;
const cursorMid = mapCursorPosition(pasteWithCountryCode, midPos, masked1);
console.log(`Cursor at ${midPos} -> masked pos: ${cursorMid}`);
console.log();

// Test 3: Rapid typing simulation
console.log("=== Test 3: Rapid typing simulation ===");
const rapidInputs = ['1', '11', '119', '1198', '11987', '119876', '1198765', '11987654', '119876543', '1198765432', '11987654321'];
rapidInputs.forEach((raw, i) => {
  const masked = maskPhone(raw);
  const cursorPos = mapCursorPosition(raw, raw.length, masked);
  console.log(`Step ${i+1}: raw="${raw}" (len=${raw.length}) -> masked="${masked}" (len=${masked.length}) cursor=${cursorPos}`);
});
console.log();

// Test 4: Selection replacement
console.log("=== Test 4: Selection replacement scenario ===");
const rawBefore = "1198765432";
const rawAfter = "1155555432";
const maskedBefore = maskPhone(rawBefore);
const maskedAfter = maskPhone(rawAfter);
console.log(`Before: raw="${rawBefore}" -> masked="${maskedBefore}"`);
console.log(`After:  raw="${rawAfter}" -> masked="${maskedAfter}"`);
const cursorAfterReplace = mapCursorPosition(rawAfter, 6, maskedAfter);
console.log(`Cursor after replace at raw pos 6 -> masked pos: ${cursorAfterReplace}`);
console.log();

// Test 5: Non-digit chars typed in middle
console.log("=== Test 5: Non-digit chars in middle ===");
const rawWithLetter = "11a98765432";
const maskedWithLetter = maskPhone(rawWithLetter);
console.log(`Input: "${rawWithLetter}" -> masked: "${maskedWithLetter}"`);
const cursorAfterLetter = mapCursorPosition(rawWithLetter, 3, maskedWithLetter);
console.log(`Cursor at 3 (after 'a') -> masked pos: ${cursorAfterLetter}`);
console.log();

// Test 6: Maximum length truncation
console.log("=== Test 6: Maximum length truncation (12+ digits) ===");
const longRaw = "119876543219999";
const maskedLong = maskPhone(longRaw);
console.log(`Input (15 digits): "${longRaw}" -> masked: "${maskedLong}" (${maskedLong.length} chars)`);
for (const pos of [0, 5, 10, 11, 12, 13, 14, 15]) {
  const cursor = mapCursorPosition(longRaw, pos, maskedLong);
  console.log(`  Cursor at raw pos ${pos} -> masked pos: ${cursor}`);
}
console.log();

// Test 7: Empty to full and back (delete all)
console.log("=== Test 7: Delete all characters one by one ===");
const deleteSequence = [
  "11987654321",
  "1198765432",
  "119876543",
  "11987654",
  "1198765",
  "119876",
  "11987",
  "1198",
  "119",
  "11",
  "1",
  ""
];
deleteSequence.forEach(raw => {
  const masked = maskPhone(raw);
  const cursor = mapCursorPosition(raw, raw.length, masked);
  console.log(`raw="${raw}" (len=${raw.length}) -> masked="${masked}" (len=${masked.length}) cursor=${cursor}`);
});
console.log();

// Test 8: Paste digits only, cursor in middle
console.log("=== Test 8: Paste digits only, cursor in middle ===");
const pasteDigits = "11987654321";
const maskedDigits = maskPhone(pasteDigits);
const cursorPasteMid = mapCursorPosition(pasteDigits, 5, maskedDigits);
console.log(`Paste: "${pasteDigits}" -> masked: "${maskedDigits}"`);
console.log(`Cursor at raw pos 5 -> masked pos: ${cursorPasteMid}`);
