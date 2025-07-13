import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface DashboardFeatureProps {
  feature: {
    key: string;
    title: string;
    route: string;
    icon?: string;
    enabled: boolean;
  };
}

const DashboardFeature: React.FC<DashboardFeatureProps> = ({ feature }) => {
  const { key, title, route, icon, enabled } = feature;

  // If feature is enabled, render as clickable link
  if (enabled) {
    return (
      <Link key={key} href={route} legacyBehavior>
        <a className="flex items-center justify-start w-full rounded-lg bg-light-primary-button dark:bg-dark-primary-button text-light-button-text dark:text-dark-button-text hover:scale-105 transition-transform duration-300 p-6 text-xl font-semibold shadow-custom-light dark:shadow-custom-dark">
          {/* Feature Icon */}
          {icon && (
            <div className="w-12 h-12 mr-4 flex items-center justify-center flex-shrink-0">
              <Image
                src={`/static/icons/${icon}`}
                alt={title}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          )}
          <span className="text-left">{title}</span>
        </a>
      </Link>
    );
  }

  // If feature is disabled, render as grayed-out with lock icon
  return (
    <div
      key={key}
      className="flex items-center justify-start w-full rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 p-6 text-xl font-semibold opacity-60 cursor-not-allowed shadow-custom-light dark:shadow-custom-dark"
    >
      {/* Feature Icon with Lock overlay */}
      <div className="w-12 h-12 mr-4 flex items-center justify-center relative flex-shrink-0">
        {/* Feature icon (grayed out) */}
        {icon && (
          <Image
            src={`/static/icons/${icon}`}
            alt={title}
            width={48}
            height={48}
            className="object-contain opacity-30"
          />
        )}
        {/* Lock overlay */}
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white dark:bg-gray-800 rounded-full p-1">
          <Image
            src="/static/icons/lock-closed.svg"
            alt="Locked"
            width={16}
            height={16}
            className="object-contain"
          />
        </div>
      </div>
      <span className="text-left">{title}</span>
    </div>
  );
};

export default DashboardFeature;