import { useState, useEffect, useRef } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { ApplicationMigration, MigrationStatus } from '../components/MigrationDashboardPage/mockData';
import { mockApplications } from '../components/MigrationDashboardPage/mockData';

/**
 * Fetches applications from the Backstage catalog that have konveyor.io annotations.
 * Falls back to mock data if catalog API is unavailable.
 */
export function useCatalogApplications() {
  const [applications, setApplications] = useState<ApplicationMigration[]>(mockApplications);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromCatalog, setFromCatalog] = useState(false);
  const fetchedRef = useRef(false);

  let catalogApi: any;
  try {
    catalogApi = useApi(catalogApiRef);
  } catch {
    catalogApi = null;
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (!catalogApi) {
      setApplications(mockApplications);
      setLoading(false);
      return;
    }

    catalogApi
      .getEntities({
        filter: {
          kind: 'Component',
          'metadata.tags': 'migration-candidate',
        },
      })
      .then((response: any) => {
        const entities = (response && response.items) || [];
        if (entities.length === 0) {
          // No catalog entities found, use mocks
          setApplications(mockApplications);
          setLoading(false);
          return;
        }

        const apps: ApplicationMigration[] = entities.map((entity: any, idx: number) => ({
          id: entity.metadata.uid || `catalog-${idx}`,
          name: entity.metadata.name,
          description: entity.metadata.description || '',
          sourceRepository:
            entity.metadata.annotations?.['github.com/project-slug']
              ? `https://github.com/${entity.metadata.annotations['github.com/project-slug']}`
              : '',
          sourceTechnology:
            entity.metadata.annotations?.['konveyor.io/source-technology']?.replace(/-/g, ' ').replace(/(\d)/, ' $1') || 'Unknown',
          targetTechnology:
            entity.metadata.annotations?.['konveyor.io/target-technology']?.replace(/-/g, ' ').replace(/(\d)/, ' $1') || 'Unknown',
          status: (entity.metadata.annotations?.['konveyor.io/migration-status'] || 'pending') as MigrationStatus,
          complexity: (entity.metadata.annotations?.['konveyor.io/complexity'] || 'medium') as 'low' | 'medium' | 'high',
          lastUpdated: entity.metadata.annotations?.['backstage.io/managed-by-origin-location']
            ? new Date().toISOString()
            : new Date().toISOString(),
        }));

        setApplications(apps);
        setFromCatalog(true);
        setLoading(false);
      })
      .catch((err: Error) => {
        console.warn('Catalog API unavailable, using mock data:', err.message);
        setApplications(mockApplications);
        setError(err);
        setLoading(false);
      });
  }, [catalogApi]);

  return { applications, loading, error, fromCatalog };
}
