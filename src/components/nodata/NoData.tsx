import { classNames } from '../../utils/common';
import styles from './NoData.module.css';

type NoDataProps = {
  title: string;
  size?: 'S' | 'M' | 'L';
};

export default function NoData({ title, size = 'M' }: NoDataProps) {
  return (
    <div className={classNames([styles.NodataContainer])}>
      <div className={classNames([styles.Nodata, styles[size]])}>
        <span className={classNames([styles.NodataText])}>{title}</span>
      </div>
    </div>
  );
}
