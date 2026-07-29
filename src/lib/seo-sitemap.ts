export const PUBLIC_CONTENT_LAST_MODIFIED_SQL = `
  SELECT MAX(modifiedAt) AS lastModified FROM (
    SELECT MAX(entryDate) AS modifiedAt
    FROM changelog_entries
    WHERE visible = 1
    UNION ALL
    SELECT MAX(updatedAt) AS modifiedAt
    FROM changelog_entries
    WHERE visible = 1
    UNION ALL
    SELECT MAX(updatedAt) AS modifiedAt
    FROM site_settings
    WHERE key = 'about.page'
    UNION ALL
    SELECT MAX(createdAt) AS modifiedAt
    FROM governance_events
  )
`;
