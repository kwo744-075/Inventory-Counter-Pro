
import React from 'react';
import CategoryScreen from '@/components/CategoryScreen';

export default function MiscScreen() {
  return (
    <CategoryScreen
      category="misc"
      title="Miscellaneous"
      icon="ellipsis.circle.fill"
      placeholderExample="Spark Plugs"
    />
  );
}
