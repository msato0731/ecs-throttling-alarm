#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EcsThrottlingAlarmStack } from '../lib/ecs-throttling-alarm-stack';

const app = new cdk.App();
new EcsThrottlingAlarmStack(app, 'EcsThrottlingAlarmStack');
