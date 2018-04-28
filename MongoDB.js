const query = Person.
  find({ occupation: /host/ }).
  where('name.last').equals('Ghost').
  where('age').gt(17).lt(66).
  where('likes').in(['vaporizing', 'talking']).
  limit(10).
  sort('-occupation').
  select('name occupation');

query.getOptions();
{ find: { occupation: 'host' }, where: [{ 'name.last': 'Ghost' }] };
// turn an object into string by JSON stringify the query 
// and make it unique and consistent customised query
// as a query key string
// and will not crash the cache 



// check to see if this query has already been
// fetched in redis

query.exec = function () {
  // to check to see if this query has already been executed
  // and if it has, return the reulst right away
  const result = client.get('query key')
  if (result) {
    return result;
  }

  // otherwise issue the query *as normal*
  const result = runTheOriginalExecFunction();

  // then save that value in redis

  client.set('query key', result);
  return result;

}

query.exec((err, result) => console.log(result));
// same as ...
query.then(result => console.log(result));
// same as ...
const result = await query;



