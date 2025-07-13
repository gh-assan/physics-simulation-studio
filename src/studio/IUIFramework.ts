export interface IUIFramework {
  addFolder(title: string): IFolderApi;
  refresh(): void;
}

export interface IFolderApi {
  addBinding(data: any, key: string, options?: any): IBindingApi;
  dispose(): void;
}

export interface IBindingApi {
  on(event: string, callback: () => void): void;
}
