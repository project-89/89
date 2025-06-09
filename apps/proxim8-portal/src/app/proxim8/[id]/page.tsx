'use client';

import Proxim8Dashboard from '@/components/proxim8-dashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Proxim8PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function Proxim8Page({ params }: Proxim8PageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [proxim8Id, setProxim8Id] = useState<string>('');

  useEffect(() => {
    // Extract the id from async params
    params.then(({ id }) => {
      setProxim8Id(id);
      // Simulate loading the Proxim8 data
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    });
  }, [params]);

  return (
    <div className="min-h-screen bg-black text-gray-200">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center h-[80vh]">
            <div className="animate-pulse text-green-400">
              Loading Proxim8 data...
            </div>
          </div>
        ) : (
          <Proxim8Dashboard proxim8Id={proxim8Id} isFullPage />
        )}
      </div>
    </div>
  );
}
