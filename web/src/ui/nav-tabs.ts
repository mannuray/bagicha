import { createContext, useContext } from 'react';

/** One bottom-navigation tab. The app supplies the list; the UI kit only draws it. */
export interface NavTab {
  to: string;
  icon: string;
  labelKey: string;
  end: boolean;
}

const NavTabsContext = createContext<readonly NavTab[]>([]);
export const NavTabsProvider = NavTabsContext.Provider;
export const useNavTabs = () => useContext(NavTabsContext);
