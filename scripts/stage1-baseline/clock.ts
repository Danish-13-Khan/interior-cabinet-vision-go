import { STAGE1_EPOCH_MS, STAGE1_RANDOM_SEED } from "./constants";

/**
 * Freeze `new Date()` and make `Date.now` / `Math.random` a pure sequence.
 * Call before any domain import. Ledger and quote ids use both.
 */
export function installStage1Clock() {
  const RealDate = Date;
  let nowStep = 0;
  let seed = STAGE1_RANDOM_SEED;

  class FrozenDate extends RealDate {
    constructor(...args: ConstructorParameters<typeof RealDate>) {
      if (args.length === 0) super(STAGE1_EPOCH_MS);
      else super(...args);
    }

    static now() {
      nowStep += 1;
      return STAGE1_EPOCH_MS + nowStep;
    }

    static parse(value: string) {
      return RealDate.parse(value);
    }

    static UTC(
      year: number,
      monthIndex?: number,
      date?: number,
      hours?: number,
      minutes?: number,
      seconds?: number,
      ms?: number,
    ) {
      return RealDate.UTC(year, monthIndex, date, hours, minutes, seconds, ms);
    }
  }

  globalThis.Date = FrozenDate as DateConstructor;
  Math.random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
