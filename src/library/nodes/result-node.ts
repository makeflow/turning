import {PathNode, TestHandler} from './common';

export class ResultNode<TContext = unknown> {
  constructor(public node: PathNode) {}

  test(handler: TestHandler<TContext>): this {
    this.node.testHandler = handler;
    return this;
  }
}