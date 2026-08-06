export interface TooltipOption {
  name: string;
  meaning: string;
}

export interface TooltipContent {
  title: string;
  body?: string;
  example?: string;
  options?: TooltipOption[];
  when?: string;
}
