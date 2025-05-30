import type { ContainerSelect, ItemSelect } from "@/server/db/schema";

export type ContainerDTO = ContainerSelect & {
  tags: string[];
};

export type ItemDTO = ItemSelect & {
  pathname: string;
  tags: string[];
};

export type DirectoryNode = {
  parent: ContainerDTO;
  items?: ItemDTO[];
  children: DirectoryNode[];
};
