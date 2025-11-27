export enum Sender {
  User = 'User',
  AI = 'AI'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: number;
  isError?: boolean;
  groundingSources?: GroundingSource[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export enum AppMode {
  Chat = 'Chat',
  ClassGenerator = 'ClassGenerator',
  BlueprintHelper = 'BlueprintHelper'
}

export interface ClassGenParams {
  className: string;
  parentClass: string;
  features: string;
}
