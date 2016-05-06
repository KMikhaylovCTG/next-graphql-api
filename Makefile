include n.Makefile

TEST_APP := "ft-next-graphql-api-${CIRCLE_BUILD_NUM}"

unit-test:
	@echo "Testing…"
	@export CONSOLE_LOG_LEVEL="error"; export MYFT_API_URL="http://my.ft.com/"; export GRAPHQL_API_KEY=123; \
		mocha --require test/server/setup --recursive --reporter spec test/server/

unit-test-watch:
	@echo "Wathching tests…"
	@export CONSOLE_LOG_LEVEL="error"; export MYFT_API_URL="http://my.ft.com/"; export GRAPHQL_API_KEY=123; \
		mocha --require test/server/setup --recursive --reporter spec --watch test/server/

test: verify unit-test

run:
	nbt run --local

provision:
	nbt float -md --testapp ${TEST_APP}
	nbt deploy-hashed-assets
	nbt test-urls ${TEST_APP}

tidy:
	nbt destroy ${TEST_APP}

deploy:
	nbt ship -m
	nbt deploy-hashed-assets

deploy-fastly-staging:
	nbt deploy-vcl -e -s FASTLY_STAGING_SERVICE_ID --vars SERVICEID --main main.vcl ./src/vcl/

deploy-fastly:
	nbt deploy-vcl -e -s FASTLY_SERVICE_ID --vars SERVICEID --main main.vcl ./src/vcl/
