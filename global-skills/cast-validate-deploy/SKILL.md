---
name: cast-validate-deploy
description: Perform comprehensive QA validation and coordinate production deployment with testing, performance validation, security checks, and rollback capabilities. Use this skill when users request "CAST VALIDATE_DEPLOY" or need complete quality assurance before production deployment.
---

# CAST: VALIDATE_DEPLOY

Execute comprehensive quality assurance validation and manage secure production deployment with automated testing, performance verification, and rollback capabilities.

## What This Performs

A complete validation and deployment pipeline including:
- Comprehensive test suite execution
- Performance and load testing
- Security vulnerability scanning
- Accessibility compliance verification
- Visual regression testing
- Production deployment coordination
- Post-deployment monitoring
- Rollback procedures if needed

## Usage Patterns

**Direct command:**
```
CAST: VALIDATE_DEPLOY
```

**With specific validation scope:**
```
CAST: VALIDATE_DEPLOY --scope testing
CAST: VALIDATE_DEPLOY --scope performance
CAST: VALIDATE_DEPLOY --environment staging
```

## Validation Pipeline

### 1. Pre-deployment Validation
- Automated test suite execution
- Code quality and security scanning
- Performance benchmark verification
- Accessibility standards compliance
- Cross-browser compatibility testing

### 2. Staging Environment Validation
- Full integration testing
- User acceptance testing (UAT)
- Performance testing under load
- Security penetration testing
- Data migration verification

### 3. Production Deployment
- Blue-green deployment strategy
- Canary releases for gradual rollout
- Real-time monitoring and alerting
- Automatic rollback triggers
- Post-deployment verification

### 4. Post-deployment Monitoring
- Application health monitoring
- Performance metrics tracking
- Error rate monitoring
- User experience analytics
- Security incident detection

## Validation Categories

### Functional Testing
- **Unit Tests:** Individual component validation
- **Integration Tests:** Component interaction testing
- **End-to-End Tests:** Complete user workflow validation
- **API Tests:** Backend service validation
- **Database Tests:** Data integrity and performance

### Performance Testing
- **Load Testing:** Normal traffic simulation
- **Stress Testing:** Peak traffic and breaking point
- **Spike Testing:** Sudden traffic increase handling
- **Volume Testing:** Large data handling capability
- **Endurance Testing:** Long-term stability

### Security Testing
- **Vulnerability Scanning:** OWASP top 10 validation
- **Authentication Testing:** Login and authorization flows
- **Input Validation:** SQL injection and XSS prevention
- **Data Protection:** Encryption and privacy compliance
- **API Security:** Endpoint protection and rate limiting

### Accessibility Testing
- **WCAG Compliance:** Web Content Accessibility Guidelines
- **Keyboard Navigation:** Full keyboard accessibility
- **Screen Reader Testing:** Assistive technology compatibility
- **Color Contrast:** Visual accessibility standards
- **Focus Management:** Proper focus indication

## Deployment Strategies

### Blue-Green Deployment
```
Production (Blue) ←→ Load Balancer ←→ Staging (Green)
                          ↓
                    Switch Traffic
                          ↓
Production (Green) ←→ Load Balancer   Blue (Standby)
```

### Canary Deployment
```
Production v1.0 (90% traffic)
     ↓
Load Balancer
     ↓
Production v1.1 (10% traffic) → Monitor → Full Rollout
```

### Rolling Deployment
```
Server 1: v1.0 → v1.1 ✓
Server 2: v1.0 → v1.1 ✓
Server 3: v1.0 → v1.1 ✓
```

## Available Scripts

### Validation Orchestrator
`scripts/validation_pipeline.py` - Execute complete validation suite

### Deployment Manager
`scripts/deployment_manager.py` - Manage production deployments

### Performance Validator
`scripts/performance_validator.py` - Run performance benchmarks

### Security Scanner
`scripts/security_scanner.py` - Execute security validation

## Quality Gates

### Automated Quality Gates
- **Test Coverage:** Minimum 80% code coverage
- **Performance:** Page load < 2 seconds
- **Security:** No high/critical vulnerabilities
- **Accessibility:** WCAG AA compliance
- **Code Quality:** No critical code smells

### Manual Quality Gates
- **Product Owner Approval:** Feature meets requirements
- **Security Review:** Security team sign-off
- **Performance Review:** Performance team approval
- **UX Review:** User experience validation
- **Legal Review:** Compliance and privacy check

## Monitoring and Alerting

### Application Monitoring
- **Health Checks:** Service availability monitoring
- **Performance Metrics:** Response time, throughput
- **Error Tracking:** Exception monitoring and alerting
- **Resource Usage:** CPU, memory, disk utilization
- **Database Performance:** Query performance monitoring

### Business Monitoring
- **User Analytics:** User behavior and engagement
- **Conversion Metrics:** Business goal tracking
- **Revenue Impact:** Financial performance monitoring
- **Customer Satisfaction:** User feedback and ratings

## Rollback Procedures

### Automatic Rollback Triggers
- Error rate exceeds threshold (>1%)
- Response time degradation (>50% increase)
- Health check failures
- Critical security alerts
- Database corruption detection

### Manual Rollback Process
1. **Incident Detection:** Identify deployment issues
2. **Impact Assessment:** Evaluate user and business impact
3. **Rollback Decision:** Approve rollback procedure
4. **Execute Rollback:** Revert to previous stable version
5. **Verification:** Confirm system stability
6. **Post-incident Review:** Analyze and improve process

## Reference Materials

For detailed validation and deployment procedures, see:
- [Testing strategies](references/testing-strategies.md)
- [Performance validation](references/performance-validation.md)
- [Security scanning](references/security-validation.md)
- [Deployment procedures](references/deployment-procedures.md)

## Integration with CI/CD

### Continuous Integration
- Automated builds on every commit
- Test suite execution
- Code quality analysis
- Security vulnerability scanning
- Artifact creation and storage

### Continuous Deployment
- Automated staging deployment
- Validation pipeline execution
- Production deployment coordination
- Monitoring and alerting setup
- Rollback automation

## Quality Standards

Every deployment must pass:
- ✅ All automated tests (100% pass rate)
- ✅ Performance benchmarks met
- ✅ Security vulnerabilities addressed
- ✅ Accessibility standards compliance
- ✅ Manual QA approval
- ✅ Stakeholder sign-off
- ✅ Monitoring and alerts configured
- ✅ Rollback procedures tested