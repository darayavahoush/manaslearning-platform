#!/usr/bin/env node
/**
 * IN THEIR WORLD — STATIC SOURCE REGRESSION SUITE
 * Static source-text assertions for Speech & Language, Dyscalculia, Executive Functioning,
 * global terminology, representation consistency, and accessibility semantics.
 * Note: This script performs static source analysis; runtime browser interactions are tested separately.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('=== IN THEIR WORLD: STATIC SOURCE REGRESSION SUITE ===\n');

let failedTests = 0;
let passedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failedTests++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  }
}

// ----------------------------------------------------
// TEST 1: Global Terminology Cleanliness
// ----------------------------------------------------
console.log('--- TEST 1: Global Terminology Cleanliness ---');

const pageTsx = fs.readFileSync(path.join(rootDir, 'web/app/page.tsx'), 'utf8');
const expPageTsx = fs.readFileSync(path.join(rootDir, 'web/app/experience/page.tsx'), 'utf8');
const itwJsx = fs.readFileSync(path.join(rootDir, 'web/components/itw/InTheirWorld.jsx'), 'utf8');

assert(!pageTsx.includes('letters will not sit still'), 'Homepage removes "letters will not sit still"');
assert(!pageTsx.includes('Experience what they feel'), 'Homepage removes "Experience what they feel"');
assert(!expPageTsx.includes('Experience What They Feel'), 'Experience metadata removes "Experience What They Feel"');
assert(!itwJsx.includes('letters that won\'t sit still'), 'ITW About block removes "letters that won\'t sit still"');
assert(!itwJsx.includes('four short simulations'), 'ITW About block removes "four short simulations"');
assert(!itwJsx.includes('Try Interactive Simulations'), 'Storybook footer removes "Try Interactive Simulations"');

// ----------------------------------------------------
// TEST 2: Speech & Language Reactive Dialogue Logic
// ----------------------------------------------------
console.log('\n--- TEST 2: Speech & Language Communication Access Studio ---');

// Check that threshold activePractices.length >= 3 is removed from Speech dialogue
assert(!itwJsx.includes('isFullySupported ? currentScenario.dialogueSupported'), 'Removed static 2-state dialogue threshold (length >= 3)');
assert(itwJsx.includes('getSpeechDialogue(activeScenarioId, activePractices)'), 'Dynamic getSpeechDialogue generator used for reactive dialogue');

// Check representation corrections
assert(!itwJsx.includes('w-w-water vapor'), 'Removed stylized written stuttering "w-w-water vapor"');
assert(itwJsx.includes('[pause]'), 'Pauses represented neutrally with [pause]');
assert(!itwJsx.includes('resets a universal cognitive processing clock'), 'Removed claims that rephrasing resets universal cognitive clock');
assert(!itwJsx.includes('caused verbal shutdown'), 'Removed deterministic claims such as "caused verbal shutdown"');
assert(!itwJsx.includes('Keep natural, comfortable eye contact and relational calm'), 'Removed demand for fixed eye contact');
assert(itwJsx.includes('without demanding fixed eye contact'), 'Respectful presence clearly distinguishes direct address from requiring eye contact');

// Check AAC Speech Audio
assert(itwJsx.includes('handlePlayAac'), 'Explicit handlePlayAac function present');
assert(itwJsx.includes('handleStopAac'), 'Explicit handleStopAac function present');
assert(itwJsx.includes('handleClearAac'), 'Explicit handleClearAac function present');
assert(itwJsx.includes('speechSynthesis.speak(utterance)'), 'Calls Web Speech API synthesis on explicit button click');
assert(itwJsx.includes('aria-live="polite"'), 'Accessible aria-live region present for speech status announcements');

// Check Speech Indian Statistics & RPwD scope
assert(itwJsx.includes('Varghese et al. (2023)'), 'Dakshina Kannada school survey (Varghese et al. 2023) cited for regional 1.68% stuttering cohort');
assert(itwJsx.includes('10.1016/j.cegh.2023.101327'), 'Varghese et al. (2023) DOI accurately cited');
assert(itwJsx.includes('3,437 school children aged 6–15 years in Dakshina Kannada district'), 'Dakshina Kannada sample size and age range cited accurately');
assert(itwJsx.includes('stuttering prevalence of 1.68%'), 'Reported finding accurately specified as stuttering prevalence rather than generalized speech disorders');
assert(itwJsx.includes('Sections 16 and 17 of the Rights of Persons with Disabilities Act 2016'), 'RPwD Act Sections 16 & 17 correctly cited');
assert(itwJsx.includes('require certified benchmark disability documentation'), 'Formal exam accommodations scope correctly stated as requiring benchmark certification');

// ----------------------------------------------------
// TEST 3: Dyscalculia — Live Multi-Representation Logic
// ----------------------------------------------------
console.log('\n--- TEST 3: Dyscalculia The Quantity Kitchen ---');

// Check representation controls aria-pressed
assert(itwJsx.includes('aria-pressed={viewMode === "grouped"}'), 'Grouped view button has aria-pressed semantics');
assert(itwJsx.includes('aria-pressed={viewMode === "bar"}'), 'Bar view button has aria-pressed semantics');
assert(itwJsx.includes('aria-pressed={viewMode === "numeric"}'), 'Numeric view button has aria-pressed semantics');

// Check numeric representation details
assert(itwJsx.includes('Current Quantity:'), 'Numeric view shows current quantity');
assert(itwJsx.includes('Base Recipe (2 servings):'), 'Numeric view shows base recipe amount');
assert(itwJsx.includes('Scaling Multiplier:'), 'Numeric view shows multiplier (x2)');
assert(itwJsx.includes('Target (4 servings):'), 'Numeric view shows target quantity');
assert(itwJsx.includes('Difference:'), 'Numeric view shows live difference between current and target');

// Check recipe quantities
assert(itwJsx.includes('original: 2') && itwJsx.includes('target: 4'), 'Lemons correctly 2 -> 4');
assert(itwJsx.includes('original: 3') && itwJsx.includes('target: 6'), 'Water correctly 3 -> 6 cups');
assert(itwJsx.includes('original: 6') && itwJsx.includes('target: 12'), 'Mint leaves correctly 6 -> 12');

// Check research citations
assert(!itwJsx.includes('NIMHANS Child & Adolescent Psychiatry Epidemiology Studies'), 'Removed unsupported NIMHANS dyscalculia prevalence citation');
assert(itwJsx.includes('Ramaa, S., & Gowramma, I. P. (2002)'), 'Ramaa & Gowramma Mysore primary school study cited with accurate bibliographic title');
assert(itwJsx.includes('10.1002/dys.214'), 'Ramaa & Gowramma (2002) correct DOI (10.1002/dys.214) cited');
assert(itwJsx.includes('8(2), 67–85'), 'Ramaa & Gowramma (2002) correct volume, issue and pagination cited');
assert(itwJsx.includes('5.98% (15 out of 251 students in grades 3–4) in Study 1, and 5.54% (78 out of 1,408 screened students) in Study 2'), 'Ramaa & Gowramma two distinct study cohorts reported separately');
assert(!itwJsx.includes('N=664'), 'Unsupported combined N=664 figure removed');
assert(itwJsx.includes('Section 5.2'), 'NCERT math kit guidance cited with accurate Section 5.2');
assert(itwJsx.includes('CBSE Circular No. CBSE/Coord/2020 (dated 20.01.2020)'), 'CBSE Circular 2020 calculator exemption (dated 20.01.2020) and Rule 24 cited');

// ----------------------------------------------------
// TEST 4: Executive Functioning — The Project Planning Desk
// ----------------------------------------------------
console.log('\n--- TEST 4: Executive Functioning The Project Planning Desk ---');

// Check visible dependencies in Workflow Map
assert(itwJsx.includes('informs: "Task 2 (Find Sources)'), 'Task 1 explicitly informs Task 2');
assert(itwJsx.includes('predecessorExplanation: "Suggested predecessor: Task 1'), 'Task 2 explains natural predecessor Task 1');
assert(itwJsx.includes('informs: "Task 3 (Record Notes)'), 'Task 2 explicitly informs Task 3');
assert(itwJsx.includes('predecessorExplanation: "Suggested predecessor: Task 2'), 'Task 3 explains natural predecessor Task 2');
assert(itwJsx.includes('informs: "Task 4 (Visual Display)'), 'Task 3 explicitly informs Task 4');
assert(itwJsx.includes('predecessorExplanation: "Suggested predecessor: Task 3'), 'Task 4 explains natural predecessor Task 3');
assert(itwJsx.includes('informs: "Task 5 (Rehearse)'), 'Task 4 explicitly informs Task 5');

// Check Next-Action Reminder
assert(itwJsx.includes('Next-Action Reminder (Editable Working Memory Anchor)'), 'Next-Action Reminder section present');
assert(itwJsx.includes('What I last worked on:'), 'Editable "What I last worked on" field present');
assert(itwJsx.includes('What I intend to do next:'), 'Editable "What I intend to do next" field present');
assert(itwJsx.includes('Resource / Document needed:'), 'Editable "Resource / Document needed" field present');

// Check Change-of-Plan Scenario
assert(itwJsx.includes('The source you planned to use is unavailable'), 'Change-of-plan scenario prompt present');
assert(itwJsx.includes('CHANGE_PLAN_OPTIONS'), 'Change-of-plan strategies array defined');
assert(itwJsx.includes('applyPlanAdjustment'), 'Interactive plan adjustment handler updates plan state');

// Check 2-Way Task Movement
assert(itwJsx.includes('title="Move task to Next column"'), 'Now tasks can move to Next');
assert(itwJsx.includes('title="Move task to Later column"'), 'Now tasks can move to Later');
assert(itwJsx.includes('onClick={() => setStatus(task.id, "now")}'), 'Next and Later tasks can move to Now');

// Check Subtask persistence & indicator
assert(itwJsx.includes('of {currentTask.subtasks.length} Subtasks Done'), 'Task chunking shows subtask completion count');

// Check Time Estimator
assert(itwJsx.includes('Illustrative Planning Time Blocks'), 'Time blocks explicitly labeled as illustrative planning estimates');
assert(!itwJsx.includes('Paced break recommended after'), 'Removed rigid "Paced break recommended after" claim');

// Check Research Citations
assert(itwJsx.includes('Selvam, S., Thomas, T., Kurpad, A. V., & Srinivasan, K. (2018)'), 'Selvam et al. 2018 Child Neuropsychology study cited with full author list');
assert(itwJsx.includes('24(2), 226–246'), 'Selvam et al. (2018) correct issue and pagination (24(2), 226–246) cited');
assert(itwJsx.includes('10.1080/09297049.2016.1254761'), 'Selvam et al. (2018) DOI cited accurately');
assert(itwJsx.includes('cohort of 412 typically-developing urban preschool children aged 2–5 in Bengaluru'), 'BRIEF-P study cited with exact sample size and preschool population constraint');
assert(!itwJsx.includes('Journal of Applied Behavior Analysis & Inclusive Pedagogy'), 'Phantom journal label removed');
assert(!itwJsx.includes('Pedagogical Scaffolding & Universal Design for Learning (UDL) Guidelines'), 'Non-traceable UDL publication label removed');
assert(!itwJsx.includes('The Prefrontal Cortex Coordination Suite'), 'Replaced single-centre coordination suite label');
assert(!itwJsx.includes('internal activation energy'), 'Replaced internal activation energy phrase');
assert(itwJsx.includes('Distributed Executive Brain Networks'), 'Accurate distributed executive networks heading present');
assert(!itwJsx.includes('reduce task refusal and transition distress by over 60%'), 'Removed unsupported "over 60%" claim');

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n=======================================================');
console.log(`TOTAL CHECKS: ${passedTests + failedTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('=======================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL STATIC SOURCE REGRESSION CHECKS PASSED!\n');
  process.exit(0);
}
