# Next GraphQL [![Circle CI](https://circleci.com/gh/Financial-Times/next-graphql-api.svg?style=svg)](https://circleci.com/gh/Financial-Times/next-graphql-api)

Shared GraphQL endpoint for Next apps

## About

This is a [GraphQL](http://facebook.github.io/graphql/) API endpoint
for the presentation layer of the Next FT application. It simplifies fetching content
from multiple sources (e.g. articles tagged with a certain topic + total page views on
those articles) and traversing links between pieces of content
(e.g. page with top story IDs -> stories -> stories in the story package,
or article -> topics -> latest articles with those topics). Such traversal queries
can be done in a single request using GraphQL (they will get translated to multiple
backend requests by the GraphQL server).

Because the possible queries are described by a [schema](http://next-graphql-api.ft.com/schema) and the schema is defined
in terms of types, extending types with new attributes immediately benefits all places
in the schema where a given type is used. For instance, adding the ability to find
related articles from story package to use on the Homepage means any query surfacing
an article automatically gets the ability to display related articles as well,
if it so desires.

GraphQL doesn't dictate any particular storage backend or data fetching mechanism,
it is simply used to orchestrate the dispatch of fetching requests for each piece of
data requested by a given query. It is therefore ideal for aggregating multiple APIs
and storage backends and sharing the high level, user-facing business logic that
doesn't fit the individual backends, e.g. combining content and its popularity/usage or
shared product-level rules, such as the most relevant articles for a given article or
even surfacing the parsed body of articles as a queryable data object to let clients
pull out specific content components from an article body.

## Setup

We cache responses in Redis, therefore for development you will need to install and run an instance of it

    brew install redis
    redis-server

## Using Next GraphQL API

You will need a GraphQL API token from the config-vars. Once you have it, you can
explore the available GraphQL schema in the [playground](http://next-graphql-api.ft.com/playground),
which uses GraphQL's introspection capabilities to suggest possible queries. Enabling mock data is achieved by sending a header `FT-Graphql-Mock-Data: true`

For an example of running a query, see the [next-front-page](http://github.com/Financial-Times/next-front-page)
– it's a simple HTTP POST request returning a JSON of the same shape of the query.

## Status monitoring

TODO: elaborate on this.
