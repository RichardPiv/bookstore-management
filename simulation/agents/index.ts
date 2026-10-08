/** Point d’entrée agents (P2.8). */
export { toStaffAgent } from "./staff-factory";
export {
  workPace,
  moraleFatigueFactor,
  reliabilityOk,
  specialtyMatchesVisitor,
  specialtyMatchesShelf,
  preferredCashierId,
  counterCodeForHome,
} from "./staff-stats";
export { bookUtility, pickBookForVisitor, shelfForBook } from "./book-pick";
export {
  createVisitorAgent,
  pickClientInterest,
  rollTemperament,
} from "./visitor-factory";
