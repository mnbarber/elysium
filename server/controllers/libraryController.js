const Library = require('../models/library');
const axios = require('axios');
const Activity = require('../models/activity');

// helper function to create activity
const createActivity = async (userId, activityType, data) => {
  try {
    const activity = new Activity({
      userId,
      activityType,
      ...data,
      isPublic: true
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

// get more book details from open library API OR from custom books
const getBookDetails = async (req, res) => {
  try {
    const bookKey = req.query.key;

    if (!bookKey) {
      return res.status(400).json({ error: 'Book key is required' });
    }

    if (bookKey.startsWith('/custom/')) {

      try {
        const allLibraries = await Library.find({});

        let customBook = null;

        for (const library of allLibraries) {
          const libraryNames = ['toRead', 'currentlyReading', 'read', 'paused', 'dnf'];

          for (const libraryName of libraryNames) {
            const libraryArray = library[libraryName];

            if (libraryArray && Array.isArray(libraryArray)) {
              customBook = libraryArray.find(b => b.key === bookKey);

              if (customBook) {
                break;
              }
            }
          }

          if (customBook) break;
        }

        if (!customBook) {
          return res.status(404).json({
            error: 'Custom book not found'
          });
        }

        const bookDetails = {
          key: customBook.key,
          title: customBook.title,
          author: customBook.author,
          coverUrl: customBook.coverUrl,
          description: customBook.description || 'No description available.',
          firstPublishYear: customBook.firstPublishYear,
          numberOfPages: customBook.numberOfPages,
          subjects: customBook.subjects || [],
          isbn: customBook.isbn,
          isCustom: true
        };

        return res.json(bookDetails);

      } catch (error) {
        console.error('Error searching for custom book:', error);
        return res.status(500).json({ error: 'Error fetching custom book' });
      }
    }

    const openLibraryUrl = `https://openlibrary.org${bookKey}.json`;

    const response = await axios.get(openLibraryUrl);
    const bookData = response.data;

    let description = 'No description available.';
    if (bookData.description) {
      if (typeof bookData.description === 'string') {
        description = bookData.description;
      } else if (bookData.description.value) {
        description = bookData.description.value;
      }
    }

    let authors = [];
    if (bookData.authors && bookData.authors.length > 0) {
      const authorPromises = bookData.authors.map(async (author) => {
        try {
          const authorResponse = await axios.get(`https://openlibrary.org${author.author.key}.json`);
          return authorResponse.data.name;
        } catch (err) {
          return 'Unknown Author';
        }
      });
      authors = await Promise.all(authorPromises);
    }

    let coverUrl = null;
    if (bookData.covers && bookData.covers.length > 0) {
      coverUrl = `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-L.jpg`;
    }

    const subjects = bookData.subjects?.slice(0, 10) || [];

    const bookDetails = {
      key: bookKey,
      title: bookData.title,
      author: authors[0] || 'Unknown Author',
      authors: authors,
      coverUrl: coverUrl,
      description: description,
      firstPublishYear: bookData.first_publish_date ?
        new Date(bookData.first_publish_date).getFullYear() : null,
      numberOfPages: bookData.number_of_pages || null,
      subjects: subjects,
      isbn: bookData.isbn_13?.[0] || bookData.isbn_10?.[0] || null,
      isCustom: false
    };

    res.json(bookDetails);
  } catch (error) {
    console.error('Error fetching book details:', error);
    res.status(500).json({ error: 'Error fetching book details' });
  }
};

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

// check if book is in user's library
const getBookLibraryStatus = async (req, res) => {
  try {
    const bookKey = decodeURIComponent(req.params.bookKey);

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.json({ inLibrary: false });
    }

    const libraryMap = {
      'toRead': 'toRead',
      'currentlyReading': 'currentlyReading',
      'read': 'read',
      'paused': 'paused',
      'dnf': 'dnf'
    };

    for (const [displayName, schemaName] of Object.entries(libraryMap)) {
      const book = library[schemaName]?.find(b => b.key === bookKey);
      if (book) {
        return res.json({
          inLibrary: true,
          library: schemaName,
          book: book
        });
      }
    }

    res.json({ inLibrary: false });
  } catch (error) {
    console.error('Error checking library status:', error);
    res.status(500).json({ error: 'Error checking library status' });
  }
};

// move book between libraries
const moveBook = async (req, res) => {
    try {
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
    
        if (toLibrary === 'read' && bookToMove) {
          bookToMove.readCount = (bookToMove.readCount || 0) + 1;
          bookToMove.completedAt = new Date();  // Add this line
        }
    
        const toField = fieldMap[toLibrary];
        if (toField) {
          if (!library[toField]) {
            library[toField] = [];
          }
          const bookData = bookToMove || {
            ...book,
            completedAt: toLibrary === 'read' ? new Date() : undefined
          };
          if (!library[toField].some(b => b.key === bookData.key)) {
            library[toField].push(bookData);
          }
        }
    
        await library.save();
    
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

        if (!library[field]) {
            library[field] = [];
        }

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

// update page progress for a book
const updatePageProgress = async (req, res) => {
  try {
    const bookKey = decodeURIComponent(req.params.bookKey);
    const { currentPage } = req.body;

    if (currentPage === undefined || currentPage === null) {
      return res.status(400).json({ error: 'Current page is required' });
    }

    if (currentPage < 0) {
      return res.status(400).json({ error: 'Current page cannot be negative' });
    }

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    let foundBook = null;
    let foundLibrary = null;

    for (const libraryName of ['currentlyReading', 'toRead', 'paused', 'read', 'dnf']) {
      foundBook = library[libraryName]?.find(b => b.key === bookKey);
      if (foundBook) {
        foundLibrary = libraryName;
        break;
      }
    }

    if (!foundBook) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    foundBook.currentPage = currentPage;

    const isComplete = foundBook.numberOfPages && currentPage >= foundBook.numberOfPages;

    await library.save();

    res.json({
      message: 'Page progress updated',
      book: foundBook,
      isComplete,
      libraries: {
        'to-read': library.toRead || [],
        'currently-reading': library.currentlyReading || [],
        'read': library.read || [],
        'paused': library.paused || [],
        'dnf': library.dnf || []
      }
    });
  } catch (error) {
    console.error('Error updating page progress:', error);
    res.status(500).json({ error: 'Error updating page progress' });
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
      
        const allLibraries = ['toRead', 'currentlyReading', 'read', 'paused', 'dnf'];
        let bookFound = false;
        let bookLibrary = null;
      
        for (const lib of allLibraries) {
          const bookIndex = library[lib].findIndex(b => b.key === book.key);
          if (bookIndex !== -1) {
            bookFound = true;
            bookLibrary = lib;
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
    const { book, review, containsSpoilers } = req.body;

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
          library.read[bookIndex].containsSpoilers = containsSpoilers || false;
          library.read[bookIndex].reviewedAt = new Date();
          await library.save();

          await createActivity(req.userId, 'reviewed_book', {
            book: {
              key: library.read[bookIndex].key,
              title: library.read[bookIndex].title,
              author: library.read[bookIndex].author,
              coverUrl: library.read[bookIndex].coverUrl
            },
            review: review,
            containsSpoilers: containsSpoilers || false
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

        const bookToMove = library[lib][bookIndex];
        bookToMove.review = review;
        bookToMove.containsSpoilers = containsSpoilers || false;
        bookToMove.reviewedAt = new Date();
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

        await createActivity(req.userId, 'reviewed_book', {
          book: {
            key: bookToMove.key,
            title: bookToMove.title,
            author: bookToMove.author,
            coverUrl: bookToMove.coverUrl
          },
          review: bookToMove.review,
          containsSpoilers: bookToMove.containsSpoilers
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

    const newBook = {
      ...book,
      review: review,
      containsSpoilers: containsSpoilers || false,
      reviewedAt: new Date()
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
      review: newBook.review,
      containsSpoilers: newBook.containsSpoilers
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
    
        let book = null;
        for (const lib of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
          book = library[lib].find(b => b.key === decodedKey);
          if (book) break;
        }
    
        if (!book) {
          return res.status(404).json({ error: 'Book not found in any library' });
        }
    
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

// get all reviews for a specific book
const getBookReviews = async (req, res) => {
  try {
    const bookKey = decodeURIComponent(req.params.bookKey);
    const currentUserId = req.userId;

    console.log('Fetching reviews for book:', bookKey);

    const libraries = await Library.find({}).populate('userId', 'username profile.displayName profile.avatarUrl profile.isPublic');

    const reviews = [];

    for (const library of libraries) {
      const isPublic = library.userId?.profile?.isPublic !== false;

      if (!isPublic) continue;

      for (const libraryName of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
        const book = library[libraryName]?.find(b => b.key === bookKey);

        if (book && book.review && book.review.trim().length > 0) {
          const likesCount = book.reviewLikes?.length || 0;
          const isLikedByCurrentUser = currentUserId ? book.reviewLikes?.includes(currentUserId) : false;

          reviews.push({
            _id: library._id + '-' + book.key,
            reviewOwnerId: library.userId._id,
            user: {
              username: library.userId?.username,
              displayName: library.userId?.profile?.displayName || library.userId?.username,
              avatarUrl: library.userId?.profile?.avatarUrl
            },
            review: book.review,
            rating: book.rating || 0,
            containsSpoilers: book.containsSpoilers || false,
            reviewedAt: book.reviewedAt || book.addedAt,
            librarySection: libraryName,
            likesCount,
            isLikedByCurrentUser
          });
          break;
        }
      }
    }

    reviews.sort((a, b) => {
      const dateA = new Date(a.reviewedAt || 0);
      const dateB = new Date(b.reviewedAt || 0);
      return dateB - dateA;
    });

    console.log(`Found ${reviews.length} reviews for book ${bookKey}`);

    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching book reviews:', error);
    res.status(500).json({ error: 'Error fetching book reviews' });
  }
};

// delete review
const deleteReview = async (req, res) => {
  try {
    const bookKey = decodeURIComponent(req.params.bookKey);

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    let foundBook = null;
    let foundLibrary = null;

    for (const libraryName of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
      foundBook = library[libraryName]?.find(b => b.key === bookKey);
      if (foundBook) {
        foundLibrary = libraryName;
        break;
      }
    }

    if (!foundBook) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    foundBook.review = '';
    foundBook.containsSpoilers = false;
    foundBook.reviewedAt = null;

    await library.save();

    await Activity.deleteMany({
      userId: req.userId,
      activityType: 'reviewed_book',
      'book.key': bookKey
    });

    res.json({
      message: 'Review deleted successfully',
      book: foundBook,
      libraries: {
        'to-read': library.toRead || [],
        'currently-reading': library.currentlyReading || [],
        'read': library.read || [],
        'paused': library.paused || [],
        'dnf': library.dnf || []
      }
    });
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

// edit book details in library
const editBookInLibrary = async (req, res) => {
  try {
    const bookKey = decodeURIComponent(req.params.bookKey);
    const updates = req.body;

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    let foundBook = null;
    let foundLibrary = null;

    for (const libraryName of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
      foundBook = library[libraryName]?.find(b => b.key === bookKey);
      if (foundBook) {
        foundLibrary = libraryName;
        break;
      }
    }

    if (!foundBook) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    if (updates.title) foundBook.title = updates.title;
    if (updates.author) foundBook.author = updates.author;
    if (updates.numberOfPages !== undefined) foundBook.numberOfPages = updates.numberOfPages;
    if (updates.firstPublishYear !== undefined) foundBook.firstPublishYear = updates.firstPublishYear;
    if (updates.description !== undefined) foundBook.description = updates.description;
    if (updates.coverUrl !== undefined) foundBook.coverUrl = updates.coverUrl;
    if (updates.isbn !== undefined) foundBook.isbn = updates.isbn;

    await library.save();

    res.json({
      message: 'Book details updated successfully',
      book: foundBook,
      libraries: {
        'to-read': library.toRead || [],
        'currently-reading': library.currentlyReading || [],
        'read': library.read || [],
        'paused': library.paused || [],
        'dnf': library.dnf || []
      }
    });
  } catch (error) {
    console.error('Error editing book:', error);
    res.status(500).json({ error: 'Error editing book' });
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
    
        const booksThisYear = library.read.filter(book => {
          if (!book.completedAt) return false;
          const completedDate = new Date(book.completedAt);
          return completedDate >= yearStart && completedDate <= now;
        });
    
        const monthlyBreakdown = {};
        for (let i = 0; i < 12; i++) {
          monthlyBreakdown[i] = 0;
        }
    
        booksThisYear.forEach(book => {
          const month = new Date(book.completedAt).getMonth();
          monthlyBreakdown[month]++;
        });
    
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

// like or unlike a review
const toggleReviewLike = async (req, res) => {
  try {
    const bookKey = decodeURIComponent(req.params.bookKey);
    const reviewOwnerId = req.body.reviewOwnerId;
    const currentUserId = req.userId;

    if (!reviewOwnerId) {
      return res.status(400).json({ error: 'Review owner ID is required' });
    }

    if (reviewOwnerId === currentUserId) {
      return res.status(400).json({ error: 'Cannot like your own review' });
    }

    const library = await Library.findOne({ userId: reviewOwnerId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    let foundBook = null;
    for (const libraryName of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
      foundBook = library[libraryName]?.find(b => b.key === bookKey);
      if (foundBook && foundBook.review) {
        break;
      }
    }

    if (!foundBook || !foundBook.review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (!foundBook.reviewLikes) {
      foundBook.reviewLikes = [];
    }

    const likeIndex = foundBook.reviewLikes.indexOf(currentUserId);
    let liked = false;

    if (likeIndex > -1) {
      foundBook.reviewLikes.splice(likeIndex, 1);
      liked = false;
    } else {
      foundBook.reviewLikes.push(currentUserId);
      liked = true;
    }

    await library.save();

    res.json({
      message: liked ? 'Review liked' : 'Review unliked',
      liked,
      likesCount: foundBook.reviewLikes.length
    });
  } catch (error) {
    console.error('Error toggling review like:', error);
    res.status(500).json({ error: 'Error updating review like' });
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
  getBookLibraryStatus,
  updatePageProgress,
  rateBook,
  updateRating,
  reviewBook,
  getReview,
  getBookReviews,
  deleteReview,
  updateCompletionDate,
  editBookInLibrary,
  getReadingStats,
  toggleReviewLike
};