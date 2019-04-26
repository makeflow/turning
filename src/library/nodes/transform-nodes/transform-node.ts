import assert from 'assert';

import _ from 'lodash';
import match from 'micromatch';

import {generatePathNodeId} from '../../@utils';
import {PathNode, TestHandler} from '../common';

export type TransformHandler<TContext = unknown> = (
  context: TContext,
) => Promise<TContext | void> | TContext | void;

export interface TransformStateMatchingOptions {
  includes?: string[];
  excludes?: string[];
}

abstract class TransformNode<TContext = unknown> implements PathNode {
  /** @internal */
  readonly id = generatePathNodeId();

  /** @internal */
  _alias: string | undefined;

  /** @internal */
  rawDescription!: string;

  protected newStates!: string[];

  /** @internal */
  handler!: TransformHandler<TContext>;

  /** @internal */
  testHandler: TestHandler<TContext> | undefined;

  constructor(
    protected obsoleteStatePatterns: string[],
    protected stateMatchingIncludePatterns: string[],
    protected stateMatchingExcludePatterns: string[],
  ) {}

  /** @internal */
  abstract get description(): string;

  /** @internal */
  transformStates(states: string[]): string[] | undefined {
    states = [...states];

    let obsoleteStatePatterns = this.obsoleteStatePatterns;
    let stateMatchingIncludePatterns = this.stateMatchingIncludePatterns;
    let stateMatchingExcludePatterns = this.stateMatchingExcludePatterns;

    let newStates = this.newStates;

    assert(obsoleteStatePatterns);
    assert(newStates);

    for (let pattern of [
      ...obsoleteStatePatterns,
      ...stateMatchingIncludePatterns,
    ]) {
      // For every obsolete state pattern or state pattern, it has at least one
      // corespondent state
      if (match(states, pattern).length === 0) {
        return undefined;
      }
    }

    if (match.some(states, stateMatchingExcludePatterns)) {
      return undefined;
    }

    states = match.not(states, obsoleteStatePatterns);

    return _.union(states, newStates);
  }

  /** @internal */
  async transform(context: TContext): Promise<TContext> {
    let handler = this.handler;

    let updatedContext = await handler(context);

    return updatedContext || context;
  }

  /** @internal */
  async test(context: TContext): Promise<void> {
    let testHandler = this.testHandler;

    if (!testHandler) {
      return;
    }

    await testHandler(context);
  }
}

export interface ITransformNode extends TransformNode {}

export const AbstractTransformNode = TransformNode;
