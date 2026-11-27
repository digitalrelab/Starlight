import { type Tree, TreeFragment } from "@lezer/common";
import { changeBetween } from "@starlight/editor/change";
import { parser } from "#dialect.ts";

export const createIncrementalParser = () => {
  let text: string | undefined;
  let tree: Tree | undefined;
  let fragments: ReadonlyArray<TreeFragment> = [];

  return (next: string): Tree => {
    if (tree && text === next) return tree;
    const change = text === undefined ? undefined : changeBetween(text, next);
    if (change) fragments = TreeFragment.applyChanges(fragments, [change]);
    tree = parser.parse(next, fragments);
    fragments = TreeFragment.addTree(tree, fragments);
    text = next;
    return tree;
  };
};
