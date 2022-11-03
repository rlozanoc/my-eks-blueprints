// lib/pipeline.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { KubecostAddOn } from '@kubecost/kubecost-eks-blueprints-addon';
import { TeamPlatform, TeamApplication } from '../teams'; // HERE WE IMPORT TEAMS


export default class PipelineConstruct extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps){
    super(scope, id)

    const account = props?.env?.account!;
    const region = props?.env?.region!;
    
    const addOnKubecost = new KubecostAddOn();

    const blueprint = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .addOns(new blueprints.ClusterAutoScalerAddOn,
            addOnKubecost)
    .teams(new TeamPlatform(account), new TeamApplication('burnham',account)); // HERE WE ADD THE TEAMS
  
    blueprints.CodePipelineStack.builder()
      .name("eks-blueprint-workshop-pipeline")
      .owner("rlozanoc")
      .repository({
          repoUrl: 'my-eks-blueprints',
          credentialsSecretName: 'github-token',
          targetRevision: 'main'
      })
      .wave({
        id: "envs",
        stages: [
          { id: "dev", stackBuilder: blueprint.clone('us-west-2')}
        ]
      })
      .build(scope, id+'-stack', props);
  }
}
