const Library = require('../models/library');
const axios = require('axios');
const Activity = require('../models/activity');

// helper function to create activity
const createActivity = async (userId, activityType, data) => {
  try {
    const activity = new Activity({
      userId,
      activityType,
      ...data
    });
    await activity.save();
  } catch (error) {
    console.error('Error creating activity:', error);
  }
};

// search books using Open Library API
const searchBooks = async (req, res) => {
  try {
    const { q } = req.query;
    const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error searching books.' });
  }
};

// get more book details from open library API
const getBookDetails = async (req, res) => {
  try {
    const { type, id } = req.params;
    const bookKey = `/${type}/${id}`;
    
    console.log('getBookDetails called');
    console.log('Type:', type, 'ID:', id);
    console.log('Book key:', bookKey);

    const workResponse = await axios.get(`https://openlibrary.org${bookKey}.json`);
    const workData = workResponse.data;

    // get the first edition for more details
    let editionData = null;
    if (workData.covers && workData.covers.length > 0) {
      try {
        const editionResponse = await axios.get(`https://openlibrary.org${bookKey}/editions.json?limit=1`);
        if (editionResponse.data.entries && editionResponse.data.entries.length > 0) {
          editionData = editionResponse.data.entries[0];
        }
      } catch (err) {
        console.error('Error fetching edition data:', err);
      }
    }

    // get author details
    let authors = [];
    if (workData.authors && workData.authors.length > 0) {
      for (const author of workData.authors.slice(0, 3)) {
        try {
          const authorResponse = await axios.get(`https://openlibrary.org${author.author.key}.json`);
          authors.push({
            name: authorResponse.data.name,
            bio: authorResponse.data.bio || '',
            birth_date: authorResponse.data.birth_date || '',
            photos: authorResponse.data.photos || []
          });
        } catch (err) {
          console.error('Error fetching author data:', err);
        }
      }
    }

    // format book description
    let description = '';
    if (workData.description) {
      if (typeof workData.description === 'string') {
        description = workData.description;
      } else if (workData.description.value) {
        description = workData.description.value;
      }
    }

    const bookDetails = {
      key: bookKey,
      title: workData.title,
      subtitle: workData.subtitle || '',
      description: description,
      coverId: workData.covers ? workData.covers[0] : null,
      subjects: workData.subjects?.slice(0, 10) || [],
      authors: authors,
      firstPublishDate: workData.first_publish_date || '',
      numberOfPages: editionData ? editionData.number_of_pages : null,
      publisher: editionData ? editionData.publishers : [],
      publishDate: editionData ? editionData.publish_date : '',
      isbn10: editionData ? editionData.isbn_10 : [],
      isbn13: editionData ? editionData.isbn_13 : [],
      physicalFormat: editionData ? editionData.physical_format : ''
    };

    res.json(bookDetails);
  } catch (error) {
    console.error('Error fetching book details:', error);
    res.status(500).json({ error: 'Error fetching book details.' });
  }
}

// browse books by genre using Open Library API
const browseByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 40, offset = 0 } = req.query;

    const formattedGenre = genre.toLowerCase().replace(/\s+/g, '_');
    const response = await axios.get(`https://openlibrary.org/subjects/${formattedGenre}.json?limit=${limit}&offset=${offset}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error browsing books by genre.' });
  }
};

const addCustomBook = async (req, res) => {
  try {
    const { title, author, coverUrl, description, numberOfPages, publishYear, subjects } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required.' });
    }

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found.' });
    }

    const customBookKey = `/custom/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const customBook = {
      key: customBookKey,
      title: title.trim(),
      author: author.trim(),
      coverUrl: coverUrl || '',
      description: description || '',
      numberOfPages: numberOfPages || null,
      publishYear: publishYear || null,
      subjects: subjects || [],
      rating: 0,
      review: '',
      readCount: 0,
      isCustom: true
    };

    library.toRead.push(customBook);
    await library.save();

    await createActivity(req.userId, 'added_custom_book', {
      book: {
        key: customBook.key,
        title: customBook.title,
        author: customBook.author,
        coverUrl: customBook.coverUrl
      },
      libraryName: 'to-read'
    });

    res.json({ 
      message: 'Custom book added successfully',
      book: customBook,
      libraries: {
        'to-read': library.toRead || [],
        'currently-reading': library.currentlyReading || [],
        'read': library.read || [],
        'paused': library.paused || [],
        'dnf': library.dnf || []
      }
    });
  } catch (error) {
    console.error('Error adding custom book:', error);
    res.status(500).json({ error: 'Error adding custom book.' });
  }
}

// get user's library
const getLibraries = async (req, res) => {
  try {
    console.log('Fetching libraries for user:', req.userId);
      let library = await Library.findOne({ userId: req.userId });
      
      if (!library) {
        library = new Library({
          userId: req.userId,
          toRead: [],
          currentlyReading: [],
          read: [],
          paused: [],
          dnf: []
        });
        await library.save();
      }
  
      res.json({
        'to-read': library.toRead,
        'currently-reading': library.currentlyReading,
        'read': library.read,
        'paused': library.paused,
        'dnf': library.dnf
      });
    } catch (error) {
      console.error('Error fetching libraries:', error);
      res.status(500).json({ error: 'Error fetching libraries' });
    }
};

// move book between libraries
const moveBook = async (req, res) => {
    try {
        console.log('move request received:', req.body);
        const { book, fromLibrary, toLibrary } = req.body;
    
        const library = await Library.findOne({ userId: req.userId });
        if (!library) {
          return res.status(404).json({ error: 'Library not found' });
        }
    
        const fieldMap = {
          'to-read': 'toRead',
          'currently-reading': 'currentlyReading',
          'read': 'read',
          'paused': 'paused',
          'dnf': 'dnf'
        };
    
        // Find the book in the source library
        let bookToMove = null;
        if (fromLibrary && fieldMap[fromLibrary]) {
          const fromField = fieldMap[fromLibrary];
          if (!library[fromField]) {
            library[fromField] = [];
          }
          const bookIndex = library[fromField].findIndex(b => b.key === book.key);
          if (bookIndex !== -1) {
            bookToMove = library[fromField][bookIndex];
            library[fromField].splice(bookIndex, 1);
          }
        }
    
        // If moving to 'read' library, increment readCount and set completion date
        if (toLibrary === 'read' && bookToMove) {
          bookToMove.readCount = (bookToMove.readCount || 0) + 1;
          bookToMove.completedAt = new Date();  // Add this line
        }
    
        // Add to new library
        const toField = fieldMap[toLibrary];
        if (toField) {
          if (!library[toField]) {
            library[toField] = [];
          }
          // Use bookToMove if we found it, otherwise use the book from request
          const bookData = bookToMove || {
            ...book,
            completedAt: toLibrary === 'read' ? new Date() : undefined
          };
          if (!library[toField].some(b => b.key === bookData.key)) {
            library[toField].push(bookData);
          }
        }
    
        await library.save();
    
        // Create activity
        if (toLibrary === 'read') {
          const activityBook = bookToMove || book;
          await createActivity(req.userId, 'finished_book', {
            book: {
              key: activityBook.key,
              title: activityBook.title,
              author: activityBook.author,
              coverUrl: activityBook.coverUrl
            }
          });
        } else {
          const activityBook = bookToMove || book;
          await createActivity(req.userId, 'moved_book', {
            book: {
              key: activityBook.key,
              title: activityBook.title,
              author: activityBook.author,
              coverUrl: activityBook.coverUrl,
              readCount: activityBook.readCount || 0
            },
            fromLibrary: fromLibrary,
            toLibrary: toLibrary
          });
        }
    
        res.json({
          message: 'Book moved successfully',
          libraries: {
            'to-read': library.toRead || [],
            'currently-reading': library.currentlyReading || [],
            'read': library.read || [],
            'paused': library.paused || [],
            'dnf': library.dnf || []
          }
        });
      } catch (error) {
        console.error('Error moving book:', error);
        res.status(500).json({ error: 'Error moving book' });
      }
};

// add book to user's library
const addBookToLibrary = async (req, res) => {
    try {
        const { libraryName } = req.params;
        const book = req.body;

        const library = await Library.findOne({ userId: req.userId });
        if (!library) {
            return res.status(404).json({ error: 'Library not found' });
        }

        const fieldMap = {
            'to-read': 'toRead',
            'currently-reading': 'currentlyReading',
            'read': 'read',
            'paused': 'paused',
            'dnf': 'dnf'
        };

        const field = fieldMap[libraryName];
        if (!field) {
            return res.status(400).json({ error: 'Invalid library name' });
        }

        // Initialize field if it doesn't exist
        if (!library[field]) {
            library[field] = [];
        }

        // Check if book already exists
        const exists = library[field].some(b => b.key === book.key);
        if (exists) {
            return res.status(400).json({ error: 'Book already in this library' });
        }

        library[field].push(book);
        await library.save();

        await createActivity(req.userId, 'added_book', {
            book: {
                key: book.key,
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl
            },
            libraryName: libraryName
        });

        res.json({
            message: 'Book added successfully',
            libraries: {
                'to-read': library.toRead || [],
                'currently-reading': library.currentlyReading || [],
                'read': library.read || [],
                'paused': library.paused || [],
                'dnf': library.dnf || []
            }
        });
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ error: 'Error adding book' });
    }
};

// remove book from user's library
const removeBookFromLibrary = async (req, res) => {
    try {
        const { libraryName, bookKey } = req.params;
        const decodedKey = decodeURIComponent(bookKey);
    
        const library = await Library.findOne({ userId: req.userId });
        if (!library) {
          return res.status(404).json({ error: 'Library not found' });
        }
    
        const fieldMap = {
          'to-read': 'toRead',
          'currently-reading': 'currentlyReading',
          'read': 'read',
          'paused': 'paused',
          'dnf': 'dnf'
        };
    
        const field = fieldMap[libraryName];
        if (!field) {
          return res.status(400).json({ error: 'Invalid library name' });
        }
    
         // Initialize field if it doesn't exist
        if (!library[field]) {
          library[field] = [];
        }
    
        library[field] = library[field].filter(book => book.key !== decodedKey);
        await library.save();
    
        res.json({
          message: 'Book removed successfully',
          libraries: {
            'to-read': library.toRead || [],
            'currently-reading': library.currentlyReading || [],
            'read': library.read || [],
            'paused': library.paused || [],
            'dnf': library.dnf || []
          }
        });
      } catch (error) {
        console.error('Error removing book:', error);
        res.status(500).json({ error: 'Error removing book' });
      }
};

// rate a book
const rateBook = async (req, res) => {
    try {
        const { book, rating } = req.body;
      
        if(!rating || rating < 1 || rating > 5) {
          return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
      
        const library = await Library.findOne({ userId: req.userId });
        if (!library) {
          return res.status(404).json({ error: 'Library not found' });
        }
      
        // Check if book is already in any library
        const allLibraries = ['toRead', 'currentlyReading', 'read', 'paused', 'dnf'];
        let bookFound = false;
        let bookLibrary = null;
      
        for (const lib of allLibraries) {
          const bookIndex = library[lib].findIndex(b => b.key === book.key);
          if (bookIndex !== -1) {
            bookFound = true;
            bookLibrary = lib;
            // Update rating if in 'read' library
            if (lib === 'read') {
              library.read[bookIndex].rating = rating;
              if (!library.read[bookIndex].completedAt) {
                library.read[bookIndex].completedAt = new Date();
              }
              await library.save();
    
              await createActivity(req.userId, 'rated_book', {
                book: {
                  key: book.key,
                  title: library.read[bookIndex].title,
                  author: library.read[bookIndex].author,
                  coverUrl: library.read[bookIndex].coverUrl
                },
                rating: rating
              });
    
              return res.json({
                message: 'Book rating updated successfully',
                book: library[lib][bookIndex],
                libraries: {
                  'to-read': library.toRead || [],
                  'currently-reading': library.currentlyReading || [],
                  'read': library.read || [],
                  'paused': library.paused || [],
                  'dnf': library.dnf || []
                }
              });
            }
    
            // if book is in another library, move it to 'read' with rating
            const bookToMove = library[lib][bookIndex];
            bookToMove.rating = rating;
            bookToMove.completedAt = new Date();
            library[lib].splice(bookIndex, 1);
            library.read.push(bookToMove);
            await library.save();
    
            await createActivity(req.userId, 'finished_book', {
              book: {
                key: bookToMove.key,
                title: bookToMove.title,
                author: bookToMove.author,
                coverUrl: bookToMove.coverUrl
              }
            });
    
            await createActivity(req.userId, 'rated_book', {
              book: {
                key: bookToMove.key,
                title: bookToMove.title,
                author: bookToMove.author,
                coverUrl: bookToMove.coverUrl
              },
              rating: rating
            });
    
            return res.json({
              message: 'Book moved to Read library with rating',
              book: bookToMove,
              libraries: {
                'to-read': library.toRead || [],
                'currently-reading': library.currentlyReading || [],
                'read': library.read || [],
                'paused': library.paused || [],
                'dnf': library.dnf || []
              }
            });
          }
        }
      
        // If book not found in any library, add to 'read' with rating
        const newBook = {
          ...book,
          rating: rating,
          completedAt: new Date()
        };
        library.read.push(newBook);
        await library.save();
    
        await createActivity(req.userId, 'added_book', {
          book: {
            key: newBook.key,
            title: newBook.title,
            author: newBook.author,
            coverUrl: newBook.coverUrl
          },
          libraryName: 'read'
        });
    
        await createActivity(req.userId, 'rated_book', {
          book: {
            key: newBook.key,
            title: newBook.title,
            author: newBook.author,
            coverUrl: newBook.coverUrl
          },
          rating: rating
        });
      
        res.json({
          message: 'Book added to Read library with rating',
          book: newBook,
          libraries: {
            'to-read': library.toRead || [],
            'currently-reading': library.currentlyReading || [],
            'read': library.read || [],
            'paused': library.paused || [],
            'dnf': library.dnf || []
          }
        });
      } catch (error) {
        console.error('Error rating book:', error);
        res.status(500).json({ error: 'Error rating book' });
      }
};

// update rating of a book
const updateRating = async (req, res) => {
    try {
        const { bookKey } = req.params;
        const { rating } = req.body;
        const decodedKey = decodeURIComponent(bookKey);
    
        if(!rating || rating < 1 || rating > 5) {
          return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
    
        const library = await Library.findOne({ userId: req.userId });
        if (!library) {
          return res.status(404).json({ error: 'Library not found' });
        }
    
        const bookIndex = library.read.findIndex(b => b.key === decodedKey);
        if (bookIndex === -1) {
          return res.status(404).json({ error: 'Book not found in Read library' });
        }
    
        library.read[bookIndex].rating = rating;
        await library.save();
    
        res.json({
          message: 'Book rating updated successfully',
          book: library.read[bookIndex],
          libraries: {
            'to-read': library.toRead || [],
            'currently-reading': library.currentlyReading || [],
            'read': library.read || [],
            'paused': library.paused || [],
            'dnf': library.dnf || []
          }
        });
      } catch (error) {
        console.error('Error updating book rating:', error);
        res.status(500).json({ error: 'Error updating book rating' });
      }
};

// review a book
const reviewBook = async (req, res) => {
    try {
        const { book, review } = req.body;

        if (!review || review.trim() === '') {
            return res.status(400).json({ error: 'Review cannot be empty' });
        }

        const library = await Library.findOne({ userId: req.userId });
        if (!library) {
            return res.status(404).json({ error: 'Library not found' });
        }

        const allLibraries = ['toRead', 'currentlyReading', 'read', 'paused', 'dnf'];
        let bookFound = false;
        let bookLibrary = null;

        for (const lib of allLibraries) {
            const bookIndex = library[lib].findIndex(b => b.key === book.key);
            if (bookIndex !== -1) {
                bookFound = true;
                bookLibrary = lib;

                if (lib === 'read') {
                    library.read[bookIndex].review = review;
                    library.read[bookIndex].updatedAt = new Date();
                    await library.save();

                    await createActivity(req.userId, 'reviewed_book', {
                        book: {
                            key: book.key,
                            title: library.read[bookIndex].title,
                            author: library.read[bookIndex].author,
                            coverUrl: library.read[bookIndex].coverUrl
                        },
                        review: review
                    });

                    return res.json({
                        message: 'Book review updated successfully',
                        book: library.read[bookIndex],
                        libraries: {
                            'to-read': library.toRead || [],
                            'currently-reading': library.currentlyReading || [],
                            'read': library.read || [],
                            'paused': library.paused || [],
                            'dnf': library.dnf || []
                        }
                    });
                }

                // if book is in another library, move it to 'read' with review
                const bookToMove = library[lib][bookIndex];
                bookToMove.review = review;
                bookToMove.updatedAt = new Date();
                library[lib].splice(bookIndex, 1);
                library.read.push(bookToMove);
                await library.save();

                await createActivity(req.userId, 'finished_book', {
                    book: {
                        key: book.key,
                        title: bookToMove.title,
                        author: bookToMove.author,
                        coverUrl: bookToMove.coverUrl
                    },
                    review: review
                });

                await createActivity(req.userId, 'reviewed_book', {
                    book: {
                        key: bookToMove.key,
                        title: bookToMove.title,
                        author: bookToMove.author,
                        coverUrl: bookToMove.coverUrl
                    },
                    review: review
                });

                return res.json({
                    message: 'Book review updated successfully',
                    book: library.read[library.read.length - 1],
                    libraries: {
                        'to-read': library.toRead || [],
                        'currently-reading': library.currentlyReading || [],
                        'read': library.read || [],
                        'paused': library.paused || [],
                        'dnf': library.dnf || []
                    }
                });
            }
        }

        // If book not found in any library, add to 'read' with review
        const newBook = {
            ...book,
            review: review,
            updatedAt: new Date()
        };
        library.read.push(newBook);
        await library.save();

        await createActivity(req.userId, 'added_book', {
            book: {
                key: newBook.key,
                title: newBook.title,
                author: newBook.author,
                coverUrl: newBook.coverUrl
            },
            libraryName: 'read'
        });

        await createActivity(req.userId, 'reviewed_book', {
            book: {
                key: newBook.key,
                title: newBook.title,
                author: newBook.author,
                coverUrl: newBook.coverUrl
            },
            review: review
        });

        return res.json({
            message: 'Book review added successfully',
            book: newBook,
            libraries: {
                'to-read': library.toRead || [],
                'currently-reading': library.currentlyReading || [],
                'read': library.read || [],
                'paused': library.paused || [],
                'dnf': library.dnf || []
            }
        });

    } catch (error) {
        console.error('Error updating book review:', error);
        res.status(500).json({ error: 'Error updating book review' });
    }
};

// get review
const getReview = async (req, res) => {
    try {
        const { bookKey } = req.params;
        const decodedKey = decodeURIComponent(bookKey);
    
        const library = await Library.findOne({ userId: req.userId });
        if (!library) {
          return res.status(404).json({ error: 'Library not found' });
        }
    
        // Find the book in all libraries
        let book = null;
        for (const lib of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
          book = library[lib].find(b => b.key === decodedKey);
          if (book) break;
        }
    
        if (!book) {
          return res.status(404).json({ error: 'Book not found in any library' });
        }
    
        // Return the review if it exists
        if (book.review) {
          return res.json({ review: book.review });
        } else {
          return res.status(404).json({ error: 'No review found for this book' });
        }
      } catch (error) {
        console.error('Error fetching book review:', error);
        res.status(500).json({ error: 'Error fetching book review' });
      }
};

// delete review
const deleteReview = async (req, res) => {
    try {
        const { bookKey } = req.params;
        const decodedKey = decodeURIComponent(bookKey);
    
        const library = await Library.findOne({ userId: req.userId });
        if (!library) {
          return res.status(404).json({ error: 'Library not found' });
        }
    
        // Find the book in all libraries
        let book = null;
        for (const lib of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
          book = library[lib].find(b => b.key === decodedKey);
          if (book) break;
        }
    
        if (!book) {
          return res.status(404).json({ error: 'Book not found in any library' });
        }
    
        // Remove the review from the book
        book.review = null;
        await library.save();
    
        return res.json({ message: 'Review deleted successfully' });
      } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Error deleting review' });
      }
};

// update completion date of a book
const updateCompletionDate = async (req, res) => {
  try {
    const { bookKey } = req.params;
    const { completedAt } = req.body;

    const decodedKey = decodeURIComponent(bookKey);

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    // Search for the book in all libraries
    let found = false;
    let bookRef = null;

    for (const libraryName of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
      const libraryArray = library[libraryName];
      if (libraryArray) {
        bookRef = libraryArray.find(b => b.key === decodedKey);
        if (bookRef) {
          found = true;
          break;
        }
      }
    }

    if (!found) {
      return res.status(404).json({ error: 'Book not found in any library' });
    }

    // Allow null/undefined to remove the date
    if (completedAt === null || completedAt === undefined || completedAt === '') {
      bookRef.completedAt = undefined;
    } else {
      bookRef.completedAt = new Date(completedAt);
    }

    await library.save();

    res.json({
      message: completedAt ? 'Completion date updated' : 'Completion date removed',
      libraries: {
        'to-read': library.toRead || [],
        'currently-reading': library.currentlyReading || [],
        'read': library.read || [],
        'paused': library.paused || [],
        'dnf': library.dnf || []
      }
    });
  } catch (error) {
    console.error('Error updating completion date:', error);
    res.status(500).json({ error: 'Error updating completion date' });
  }
};

// get reading stats
const getReadingStats = async (req, res) => {
    try {
        const library = await Library.findOne({ userId: req.userId });
        if (!library) {
          return res.status(404).json({ error: 'Library not found' });
        }
    
        const now = new Date();
        const currentYear = now.getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
    
        // count books read this year
        const booksThisYear = library.read.filter(book => {
          if (!book.completedAt) return false;
          const completedDate = new Date(book.completedAt);
          return completedDate >= yearStart && completedDate <= now;
        });
    
        // calculate monthly breakdown
        const monthlyBreakdown = {};
        for (let i = 0; i < 12; i++) {
          monthlyBreakdown[i] = 0;
        }
    
        booksThisYear.forEach(book => {
          const month = new Date(book.completedAt).getMonth();
          monthlyBreakdown[month]++;
        });
    
        // get reading streak
        const activities = await Activity.find({
          userId: req.userId,
          activityType: 'finished_book'
        }).sort({ createdAt: -1 });
    
        res.json({
          totalBooksRead: library.read.length,
          booksThisYear: booksThisYear.length,
          booksThisMonth: booksThisYear.filter(book => new Date(book.completedAt).getMonth() === now.getMonth()).length,
          monthlyBreakdown: monthlyBreakdown,
          currentYear: currentYear,
          recentlyFinishedBooks: booksThisYear.slice(-5).map(book => ({
            key: book.key,
            title: book.title,
            author: book.author,
            completedAt: book.completedAt
          }))
        });
      } catch (error) {
        console.error('Error fetching reading stats:', error);
        res.status(500).json({ error: 'Error fetching reading stats' });
      }
};

module.exports = {
  searchBooks,
  getBookDetails,
  browseByGenre,
  getLibraries,
  addCustomBook,
  addBookToLibrary,
  removeBookFromLibrary,
  moveBook,
  rateBook,
  updateRating,
  reviewBook,
  getReview,
  deleteReview,
  updateCompletionDate,
  getReadingStats
};