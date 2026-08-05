import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type RefObject,
} from 'react';
import styles from './TabsContainer.module.css';

export interface Tab<TProps> {
  name: string;
  icon: ReactElement;
  component: (props: TProps) => ReactElement;
}

interface TabWithRef<TProps> extends Tab<TProps> {
  ref: RefObject<HTMLButtonElement>;
}

type TabSize = 'S' | 'M' | 'L';

interface TabContainerProps<TProps> {
  tabs: Tab<TProps>[];
  props: TProps;
  onChange?: (tab: Tab<TProps>) => void;
  actions?: React.ReactNode;
  defaultTabName?: string;
  size?: TabSize;
}

export const TabsContainer = <TProps,>({
  tabs,
  props,
  onChange,
  actions,
  defaultTabName,
  size = 'M',
}: TabContainerProps<TProps>) => {
  const navigatorRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const tabsWithRefs = useMemo<TabWithRef<TProps>[]>(
    () => tabs.map((tab) => ({ ...tab, ref: createRef<HTMLButtonElement>() })),
    [tabs],
  );

  const sizeClass = {
    S: styles.sizeS,
    M: styles.sizeM,
    L: styles.sizeL,
  }[size];

  const [activeTabName, setActiveTabName] = useState<string | undefined>(defaultTabName ?? tabsWithRefs[0]?.name);
  const [tabPosition, setTabPosition] = useState({ left: 0, width: 0 });

  const resolvedActiveTabName = useMemo(
    () => (tabsWithRefs.some((tab) => tab.name === activeTabName) ? activeTabName : tabsWithRefs[0]?.name),
    [activeTabName, tabsWithRefs],
  );

  const activeTab = useMemo(
    () => tabsWithRefs.find((tab) => tab.name === resolvedActiveTabName) ?? tabsWithRefs[0],
    [resolvedActiveTabName, tabsWithRefs],
  );

  const activeIndex = useMemo(
    () => tabsWithRefs.findIndex((tab) => tab.name === activeTab?.name),
    [tabsWithRefs, activeTab],
  );

  const updateTabLine = useCallback((tab?: TabWithRef<TProps>) => {
    if (!tab?.ref.current || !lineRef.current) return;

    const tabRect = tab.ref.current.getBoundingClientRect();
    const lineRect = lineRef.current.getBoundingClientRect();

    setTabPosition({
      left: tabRect.left - lineRect.left,
      width: tabRect.width,
    });
  }, []);

  const selectTab = useCallback(
    (tab: TabWithRef<TProps>) => {
      setActiveTabName(tab.name);
      onChange?.(tab);

      requestAnimationFrame(() => {
        tab.ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      });
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (!tabsWithRefs.length) return;

      const lastIndex = tabsWithRefs.length - 1;
      let nextIndex = index;

      if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
      if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = lastIndex;

      if (nextIndex === index) return;

      event.preventDefault();

      const nextTab = tabsWithRefs[nextIndex];
      nextTab.ref.current?.focus();
      selectTab(nextTab);
    },
    [tabsWithRefs, selectTab],
  );

  useEffect(() => {
    if (!activeTab?.ref.current) return;

    const observer = new ResizeObserver(() => updateTabLine(activeTab));

    observer.observe(activeTab.ref.current);
    if (navigatorRef.current) observer.observe(navigatorRef.current);

    const timeout = window.setTimeout(() => updateTabLine(activeTab), 0);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [activeTab, tabsWithRefs.length, updateTabLine]);

  useEffect(() => {
    updateTabLine(activeTab);
  }, [activeTabName, activeTab, updateTabLine]);

  if (!activeTab || tabsWithRefs.length === 0) {
    return <div className={styles.noTabsMessage}>No tabs available</div>;
  }

  return (
    <section className={styles.componentTabsContainer} onMouseDown={(event) => event.stopPropagation()}>
      <header className={`${styles.tabHeader} ${sizeClass}`}>
        <div className={styles.tabScroller} ref={navigatorRef}>
          <div className={styles.navigator} role="tablist" aria-label="Tabs">
            {tabsWithRefs.map((tab, index) => {
              const isActive = activeTab.name === tab.name;

              return (
                <button
                  key={tab.name}
                  ref={tab.ref}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.configTab} ${isActive ? styles.active : ''}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectTab(tab)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                >
                  <span className={styles.tabIcon}>{tab.icon}</span>
                  <span className={styles.tabLabel}>{tab.name}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.tabLineContainer} ref={lineRef}>
            <div
              className={styles.tabLine}
              style={{ width: `${tabPosition.width}px`, left: `${tabPosition.left}px` }}
            />
          </div>
        </div>

        {actions && <div className={styles.actions}>{actions}</div>}
      </header>

      <div
        className={styles.configTabsContent}
        role="tabpanel"
        aria-label={activeTab.name}
        data-active-index={activeIndex}
      >
        {activeTab.component(props)}
      </div>
    </section>
  );
};
