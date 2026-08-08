export interface CheckReporter {
  (name: string, condition: boolean): void;
}
