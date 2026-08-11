export interface TooltipOption {
  name: string;
  meaning: string;
}

export interface TooltipContent {
  title: string;
  body?: string;
  options?: TooltipOption[];
  when?: string;
}
