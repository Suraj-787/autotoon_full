'use client';

import React, { useState, useEffect } from 'react';
import { getLibrary, deleteComic } from '../../lib/api';

import { LibraryItem } from '../../lib/api';

export default function LibraryPage() {
  const [comics, setComics] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load library on component mount
  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      const libraryItems = await getLibrary();
      console.log('📚 Library items loaded:', libraryItems);
      setComics(libraryItems);
    } catch (err) {
      console.error('Error loading library:', err);
      setError('Error loading library');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (comicId: string) => {
    if (!confirm('Are you sure you want to delete this comic?')) {
      return;
    }

    try {
      await deleteComic(comicId);
      setComics(comics.filter(comic => comic.id !== comicId));
    } catch (err) {
      console.error('Error deleting comic:', err);
      alert('Error deleting comic');
    }
  };

  const handleDownloadPDF = (comic: LibraryItem) => {
    if (!comic.pdfPath) {
      alert('PDF not available for this comic');
      return;
    }
    const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${comic.pdfPath}`;
    window.open(pdfUrl, '_blank');
  };

  const filteredComics = comics.filter(comic =>
    comic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comic.story.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comic.style.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Loading your comic library...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📚 Your Comic Library
          </h1>
          <p className="text-gray-600 text-lg">
            Browse and manage your AI-generated comic collection
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search comics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center mb-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg inline-block">
              {error}
            </div>
            <div className="mt-4">
              <button
                onClick={loadLibrary}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Comics Grid */}
        {!error && (
          <>
            {filteredComics.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📖</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {searchTerm ? 'No comics found' : 'Your library is empty'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm 
                    ? 'Try a different search term'
                    : 'Create your first comic to see it here!'
                  }
                </p>
                {!searchTerm && (
                  <a
                    href="/create"
                    className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Create Your First Comic
                  </a>
                )}
              </div>
            ) : (
              <>
                {/* Results count */}
                <div className="mb-6 text-center">
                  <p className="text-gray-600">
                    {filteredComics.length} comic{filteredComics.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                {/* Comics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredComics.map((comic) => (
                    <div
                      key={comic.id}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        {comic.thumbnail || (comic.images && comic.images[0]) ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${comic.thumbnail || comic.images?.[0]}`}
                            alt={comic.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className="text-4xl text-gray-400 hidden">📖</div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                          {comic.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {comic.story}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {comic.style}
                          </span>
                          <span>{formatDate(comic.createdAt)}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadPDF(comic)}
                            disabled={!comic.pdfPath}
                            className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                              comic.pdfPath 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {comic.pdfPath ? 'Download PDF' : 'PDF Unavailable'}
                          </button>
                          <button
                            onClick={() => handleDelete(comic.id)}
                            className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
