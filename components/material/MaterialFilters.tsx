'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface MaterialFiltersProps {
  projects: string[];
  selectedProject: string;
  products: string[];
  selectedProduct: string;
  subProducts: string[];
  selectedSubProduct: string;
  quantity: number;
  trainset: string;
  nama: string;
  noKpm: string;
  noKpmOptions: string[];
  canManageMaterialDelivery: boolean;
}

const PIC_OPTIONS = ['Aang', 'Egi', 'Eko', 'Resti', 'Ruli', 'Taufiq', 'Vany'];

export default function MaterialFilters({
  projects,
  selectedProject,
  products,
  selectedProduct,
  subProducts,
  selectedSubProduct,
  quantity,
  trainset,
  nama,
  noKpm,
  noKpmOptions,
  canManageMaterialDelivery,
}: MaterialFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    const IDLE_REFRESH_MS = 2 * 60 * 1000;
    const checkInterval = window.setInterval(() => {
      const idleDuration = Date.now() - lastActivityRef.current;
      if (idleDuration >= IDLE_REFRESH_MS) {
        router.refresh();
        lastActivityRef.current = Date.now();
      }
    }, 15_000);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      window.clearInterval(checkInterval);
    };
  }, [router]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleProjectChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete('project');
      params.delete('produk');
      params.delete('sub_produk');
    } else {
      params.set('project', value);
      params.delete('produk');
      params.delete('sub_produk');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label htmlFor="project" className="block text-sm text-gray-300 mb-1">
            Pilih Project
          </label>
          <select
            id="project"
            name="project"
            value={selectedProject}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
          >
            <option value="">Semua Project</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="produk" className="block text-sm text-gray-300 mb-1">
            Pilih Produk
          </label>
          <select
            id="produk"
            name="produk"
            value={selectedProduct}
            onChange={(e) => updateParam('produk', e.target.value)}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
          >
            <option value="">Semua Produk</option>
            {products.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sub_produk" className="block text-sm text-gray-300 mb-1">
            Sub Produk
          </label>
          <select
            id="sub_produk"
            name="sub_produk"
            value={selectedSubProduct}
            onChange={(e) => updateParam('sub_produk', e.target.value)}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
          >
            <option value="">Semua Sub Produk</option>
            {subProducts.map((subProduct) => (
              <option key={subProduct} value={subProduct}>
                {subProduct}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label htmlFor="quantity" className="block text-sm text-gray-300 mb-1">
            Jumlah Produk yang dikirim
          </label>
          <select
            id="quantity"
            name="quantity"
            value={String(quantity)}
            onChange={(e) => updateParam('quantity', e.target.value)}
            disabled={!canManageMaterialDelivery}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
          >
            {Array.from({ length: 9 }, (_, idx) => idx + 1).map((qty) => (
              <option key={qty} value={qty}>
                {qty}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="trainset" className="block text-sm text-gray-300 mb-1">
            Trainset
          </label>
          <select
            id="trainset"
            name="trainset"
            value={trainset}
            onChange={(e) => updateParam('trainset', e.target.value)}
            disabled={!canManageMaterialDelivery}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
          >
            <option value="">Pilih Trainset</option>
            {Array.from({ length: 7 }, (_, idx) => 50 + idx).map((option) => (
              <option key={option} value={String(option)}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="no_kpm" className="block text-sm text-gray-300 mb-1">
            No. KPM
          </label>
          <select
            id="no_kpm"
            name="no_kpm"
            value={noKpm}
            onChange={(e) => updateParam('no_kpm', e.target.value)}
            disabled={!canManageMaterialDelivery}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
          >
            <option value="">Pilih No. KPM</option>
            {noKpmOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="nama" className="block text-sm text-gray-300 mb-1">
            PIC
          </label>
          <select
            id="nama"
            name="nama"
            value={nama}
            onChange={(e) => updateParam('nama', e.target.value)}
            disabled={!canManageMaterialDelivery}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
          >
            <option value="">Pilih PIC</option>
            {PIC_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
