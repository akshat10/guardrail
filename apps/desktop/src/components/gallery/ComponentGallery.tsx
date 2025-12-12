import { useGalleryStore } from '../../stores/gallery-store';
import { ComponentViewer } from './ComponentViewer';

export function ComponentGallery() {
  const selectedComponent = useGalleryStore((state) => state.selectedComponent);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950">
      {selectedComponent ? (
        <ComponentViewer />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Component Gallery
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Select a component from the sidebar to view its documentation, variants, and
              interactive preview.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
