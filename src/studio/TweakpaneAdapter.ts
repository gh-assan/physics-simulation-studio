import { Pane, FolderApi } from "tweakpane";
import { IUIFramework, IFolderApi, IBindingApi } from "./IUIFramework";

class TweakpaneBindingApi implements IBindingApi {
  private binding: any;
  constructor(binding: any) {
    this.binding = binding;
  }
  on(event: string, callback: () => void): void {
    this.binding.on(event, callback);
  }
}

class TweakpaneFolderApi implements IFolderApi {
  private folder: FolderApi;
  constructor(folder: FolderApi) {
    this.folder = folder;
  }
  addBinding(data: any, key: string, options?: any): IBindingApi {
    return new TweakpaneBindingApi(this.folder.addBinding(data, key, options));
  }
  dispose(): void {
    this.folder.dispose();
  }
}

export class TweakpaneAdapter implements IUIFramework {
  private pane: Pane;
  constructor(pane: Pane) {
    this.pane = pane;
  }
  addFolder(title: string): IFolderApi {
    return new TweakpaneFolderApi(this.pane.addFolder({ title }));
  }
  refresh(): void {
    this.pane.refresh();
  }
}
