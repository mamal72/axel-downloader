import StreamSplitter from 'stream-splitter';


// Download operations
const downloadOperations = [
  {
    type: 'start',
    pattern: /Starting download/,
    props: []
  },
  {
    type: 'progress',
    pattern: /\[\s+(\d+)%][\s.]+\[\s*(\d+\.?\d)KB\/s]/,
    props: [
      'progress',
      'speed'
    ]
  },
  {
    type: 'connection-finished',
    pattern: /Connection\s(\d+)\sfinished/,
    props: [
      'number'
    ]
  }
];

// Get a stream that splits on a token
export function splitStream(stream, token = '\n') {
  return stream.pipe(StreamSplitter(token));
}

// Parse stdout and return operation type and params
export function parseProgress(rawDownloadProgress) {
  const operation = downloadOperations.find(item => rawDownloadProgress.match(item.pattern));

  if (!operation) {
    return {
      type: 'none'
    };
  }

  const matchedPattern = rawDownloadProgress.match(operation.pattern);
  matchedPattern.shift();

  const result = operation.props.reduce((acc, curr) => (
    {
      type: acc.type,
      data: {
        ...acc.data,
        [curr]: matchedPattern.shift()
      }
    }
  ), {
    type: operation.type,
    data: {}
  });

  return result;
}
