include n.Makefile

TEST_APP := "ft-next-graphql-api-${CIRCLE_BUILD_NUM}"

unit-test:
	@echo "Testing…"
	@export CONSOLE_LOG_LEVEL="error"; export MYFT_API_URL="http://my.ft.com/"; export GRAPHQL_API_KEY=123; \
		mocha --require test/server/setup --recursive --reporter spec test/server/

unit-test-watch:
	@echo "Watching tests…"
	@export CONSOLE_LOG_LEVEL="error"; export MYFT_API_URL="http://my.ft.com/"; export GRAPHQL_API_KEY=123; \
		mocha --require test/server/setup --recursive --reporter spec --watch test/server/

test: verify unit-test

run:
	nht run --local

provision:
	nht float -md --testapp ${TEST_APP}
	nht deploy-hashed-assets
	nht test-urls ${TEST_APP}

tidy:
	nht destroy ${TEST_APP}

deploy:
	nht ship -m
	nht deploy-hashed-assets

deploy-fastly-staging:
	fastly-tools deploy -e -s FASTLY_STAGING_SERVICE_ID --vars SERVICEID --main main.vcl ./src/vcl/

deploy-fastly:
	fastly-tools deploy -e -s FASTLY_SERVICE_ID --vars SERVICEID --main main.vcl ./src/vcl/
