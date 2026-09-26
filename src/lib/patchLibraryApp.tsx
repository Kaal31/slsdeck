import {
  afterPatch,
  appDetailsClasses,
  createReactTreePatcher,
  findInReactTree,
} from "@decky/ui";
import { routerHook } from "@decky/api";
import { ReactElement } from "react";
import { GameActionButtons } from "../components/GameActionButtons";
import { GameDetailsBadge } from "../components/GameDetailsBadge";

/**
 * Inject the SLSDeck bar into the library app-details page by patching the
 * route's render tree (the version-proof approach the ui-examples use — a real
 * React element spliced into the page's own tree, not DOM-scraping the store).
 * We splice into the app-details InnerContainer so it sits below the hero /
 * action buttons with comfortable spacing.
 */
export function patchLibraryApp() {
  return routerHook.addPatch("/library/app/:appid", (tree: any) => {
    const routeProps = findInReactTree(tree, (x: any) => x?.renderFunc);
    if (routeProps) {
      const patcher = createReactTreePatcher(
        [
          (t: any) =>
            findInReactTree(t, (x: any) => x?.props?.children?.props?.overview)?.props
              ?.children,
        ],
        (_: any[], ret?: ReactElement) => {
          const container: any = findInReactTree(
            ret,
            (x: any) =>
              Array.isArray(x?.props?.children) &&
              x?.props?.className?.includes(appDetailsClasses.InnerContainer)
          );
          if (typeof container === "object") {
            container.props.children.splice(1, 0, <GameDetailsBadge />, <GameActionButtons />);
          }
          return ret;
        }
      );
      afterPatch(routeProps, "renderFunc", patcher);
    }
    return tree;
  });
}
