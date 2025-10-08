'use client';

import { Box, Typography } from '@mui/material';
import { ProviderCard } from './ProviderCard';
import type { ProviderCardProps } from './ProviderCard';

interface Props {
  matches: ProviderCardProps[] | null;
}

export default function MatchResults({ matches }: Props) {
  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <Box className="mt-8 max-w-2xl mx-auto">
      <Typography variant="h5" className="mb-4">
        Your Matches
      </Typography>
      {matches.map((provider) => (
        <ProviderCard
          key={provider.name}
          {...provider}
          isBestMatch={provider === matches[0]}
        />
      ))}
    </Box>
  );
} 