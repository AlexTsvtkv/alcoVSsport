import React from 'react';
import { cookies } from 'next/headers';
import { getBroadcasts } from '@/actions/social';
import TickerTapeClient from './TickerTapeClient';

export default async function TickerTape() {
  const cookieStore = await cookies();
  const isVisible = cookieStore.get('show_ticker')?.value !== 'false';

  const broadcasts = isVisible ? await getBroadcasts() : [];

  return <TickerTapeClient broadcasts={broadcasts} isVisible={isVisible} />;
}