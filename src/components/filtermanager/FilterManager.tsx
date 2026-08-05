import { Layers, Ruler, Trash2 } from 'lucide-react';

import type { ReactNode } from 'react';
import { generateRandomString } from '../../utils/common';
import Button from '../button/button';
import Input from '../input/input';
import styles from './FilterManager.module.css';

type UnionType = 'AND' | 'OR';

export type FilterRule = {
  id: string;
  union?: UnionType;
  group?: FilterRule[];
  [key: string]: unknown;
};

type FilterManagerProps = {
  condition: FilterRule;
  setCondition: () => void;
  addElement: (currentRule: FilterRule) => void;
  renderRule: (child: FilterRule, parent: FilterRule) => ReactNode;
};

export default function FilterManager({ condition, setCondition, addElement, renderRule }: FilterManagerProps) {
  function renderButtons(currentRule: FilterRule, addGroup = false) {
    const Icon = addGroup ? Layers : Ruler;

    return (
      <Button
        type="button"
        title={addGroup ? 'Add group' : 'Add rule'}
        aria-label={addGroup ? 'Add group' : 'Add rule'}
        onClick={() => {
          if (addGroup) {
            if (!currentRule.group) currentRule.group = [];

            currentRule.group.push({
              id: generateRandomString(),
              union: 'AND',
              group: [],
            });

            setCondition();
            return;
          }

          addElement(currentRule);
        }}
      >
        <Icon size={18} />
      </Button>
    );
  }

  function renderDeleteButton(child: FilterRule, group: FilterRule[]) {
    return (
      <Button
        type="button"
        title="Delete group"
        aria-label="Delete group"
        onClick={() => {
          const index = group.findIndex((ch) => ch.id === child.id);

          if (index !== -1) {
            group.splice(index, 1);
            setCondition();
          }
        }}
      >
        <Trash2 size={18} />
      </Button>
    );
  }

  function renderUnion(currentRule: FilterRule) {
    return (
      <Input
        className={styles.union}
        value={currentRule.union ?? 'AND'}
        onChange={(e) => {
          currentRule.union = e as UnionType;
          setCondition();
        }}
      >
        {(['AND', 'OR'] as UnionType[]).map((uOpt) => (
          <option key={uOpt} value={uOpt}>
            {uOpt}
          </option>
        ))}
      </Input>
    );
  }

  function renderGroup(childRule: FilterRule, parent?: FilterRule, isRoot = false) {
    return (
      <div className={styles.groupContainer}>
        <div className={styles.buttonsContainer}>
          <div className={styles.addButtons}>
            {renderUnion(childRule)}
            {renderButtons(childRule, true)}
            {renderButtons(childRule)}
          </div>

          {!isRoot && parent?.group && renderDeleteButton(childRule, parent.group)}
        </div>

        <div className={styles.groupChildren}>
          {childRule.group?.map((child) => (
            <div key={child.id} className={styles.ruleContainer}>
              {child.group ? renderGroup(child, childRule) : renderRule(child, childRule)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div className={styles.filterManager}>{renderGroup(condition, undefined, true)}</div>;
}
